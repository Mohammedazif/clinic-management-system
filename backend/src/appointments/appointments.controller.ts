import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '../entities/appointment.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    console.log('📝 Creating appointment with data:', createAppointmentDto);
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  async findAll(
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('patientName') patientName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {
      doctorId,
      date,
      status,
      patientName,
    };

    if (startDate && endDate) {
      filters.dateRange = { start: startDate, end: endDate };
    }

    return this.appointmentsService.findAll(filters);
  }

  @Get('stats')
  async getStats() {
    return this.appointmentsService.getAppointmentStats();
  }

  @Get('today')
  async getTodayAppointments() {
    return this.appointmentsService.findTodayAppointments();
  }

  @Get('upcoming')
  async getUpcomingAppointments(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days) : 7;
    return this.appointmentsService.findUpcomingAppointments(daysNumber);
  }

  @Get('doctor/:doctorId')
  async findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findByDoctor(doctorId, date);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: AppointmentStatus }) {
    return this.appointmentsService.updateStatus(id, body.status);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.appointmentsService.cancel(id, body.reason);
  }

  @Patch(':id/reschedule')
  async reschedule(
    @Param('id') id: string,
    @Body() body: { date: string; time: string },
  ) {
    return this.appointmentsService.reschedule(id, body.date, body.time);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.appointmentsService.remove(id);
    return { message: 'Appointment deleted successfully' };
  }
}
