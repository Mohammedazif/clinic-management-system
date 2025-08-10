import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorStatus } from '../entities/doctor.entity';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  async findAll(
    @Query('specialization') specialization?: string,
    @Query('status') status?: DoctorStatus,
    @Query('location') location?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters = {
      specialization,
      status,
      location,
      isActive: isActive ? isActive === 'true' : undefined,
    };

    return this.doctorsService.findAll(filters);
  }

  @Get('available')
  async findAvailable() {
    return this.doctorsService.findAvailable();
  }

  @Get('specialization/:specialization')
  async findBySpecialization(@Param('specialization') specialization: string) {
    return this.doctorsService.findBySpecialization(specialization);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(AuthGuard('jwt'))
  async getDoctorStats(@Param('id') id: string) {
    return this.doctorsService.getDoctorStats(id);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats() {
    return this.doctorsService.getStats();
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: DoctorStatus }) {
    return this.doctorsService.updateStatus(id, body.status);
  }

  @Patch(':id/activate')
  @UseGuards(AuthGuard('jwt'))
  async activate(@Param('id') id: string) {
    return this.doctorsService.activate(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  async deactivate(@Param('id') id: string) {
    return this.doctorsService.deactivate(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    await this.doctorsService.remove(id);
    return { message: 'Doctor deleted successfully' };
  }
}
