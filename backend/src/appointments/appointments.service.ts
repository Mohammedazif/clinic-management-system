import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus, AppointmentPriority } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const { doctorId, date, time, ...appointmentData } = createAppointmentDto;

    // Verify doctor exists and is active
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId, isActive: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found or inactive');
    }

    // Check for appointment conflicts
    const existingAppointment = await this.appointmentRepository.findOne({
      where: {
        doctorId,
        date,
        time,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    if (existingAppointment) {
      throw new ConflictException('Doctor already has an appointment at this time');
    }

    // Validate appointment time is in doctor's availability
    if (!doctor.availability.includes(time)) {
      throw new BadRequestException('Selected time is not in doctor\'s availability');
    }

    // Create appointment
    const appointment = this.appointmentRepository.create({
      ...appointmentData,
      doctorId,
      date,
      time,
      status: AppointmentStatus.SCHEDULED,
    });

    return this.appointmentRepository.save(appointment);
  }

  async findAll(filters?: {
    doctorId?: string;
    date?: string;
    status?: AppointmentStatus;
    patientName?: string;
    dateRange?: { start: string; end: string };
  }): Promise<Appointment[]> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor');

    if (filters?.doctorId) {
      queryBuilder.andWhere('appointment.doctorId = :doctorId', { doctorId: filters.doctorId });
    }

    if (filters?.date) {
      queryBuilder.andWhere('appointment.date = :date', { date: filters.date });
    }

    if (filters?.status) {
      queryBuilder.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters?.patientName) {
      queryBuilder.andWhere('appointment.patientName LIKE :patientName', {
        patientName: `%${filters.patientName}%`,
      });
    }

    if (filters?.dateRange) {
      queryBuilder.andWhere('appointment.date BETWEEN :startDate AND :endDate', {
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
      });
    }

    return queryBuilder.orderBy('appointment.date', 'ASC').addOrderBy('appointment.time', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async findByDoctor(doctorId: string, date?: string): Promise<Appointment[]> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('appointment.doctorId = :doctorId', { doctorId });

    if (date) {
      queryBuilder.andWhere('appointment.date = :date', { date });
    }

    return queryBuilder.orderBy('appointment.date', 'ASC').addOrderBy('appointment.time', 'ASC').getMany();
  }

  async findTodayAppointments(): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.findAll({ date: today });
  }

  async findUpcomingAppointments(days: number = 7): Promise<Appointment[]> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);

    return this.findAll({
      dateRange: {
        start: today.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      status: AppointmentStatus.SCHEDULED,
    });
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);

    // If updating doctor, date, or time, check for conflicts
    if (updateAppointmentDto.doctorId || updateAppointmentDto.date || updateAppointmentDto.time) {
      const doctorId = updateAppointmentDto.doctorId || appointment.doctorId;
      const date = updateAppointmentDto.date || appointment.date;
      const time = updateAppointmentDto.time || appointment.time;

      const conflictingAppointment = await this.appointmentRepository.findOne({
        where: {
          doctorId,
          date,
          time,
          status: AppointmentStatus.SCHEDULED,
        },
      });

      if (conflictingAppointment && conflictingAppointment.id !== id) {
        throw new ConflictException('Doctor already has an appointment at this time');
      }
    }

    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentRepository.save(appointment);
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = status;

    // Set timestamps based on status
    const now = new Date();
    switch (status) {
      case AppointmentStatus.IN_PROGRESS:
        // Could track consultation start time if needed
        break;
      case AppointmentStatus.COMPLETED:
        // Could track consultation end time if needed
        break;
    }

    return this.appointmentRepository.save(appointment);
  }

  async cancel(id: string, reason?: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    if (reason) {
      appointment.notes = appointment.notes ? `${appointment.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    }

    return this.appointmentRepository.save(appointment);
  }

  async reschedule(id: string, newDate: string, newTime: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Can only reschedule scheduled appointments');
    }

    // Check for conflicts at new time
    const conflictingAppointment = await this.appointmentRepository.findOne({
      where: {
        doctorId: appointment.doctorId,
        date: newDate,
        time: newTime,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException('Doctor already has an appointment at the new time');
    }

    appointment.date = newDate;
    appointment.time = newTime;

    return this.appointmentRepository.save(appointment);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }

  async getAppointmentStats(): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    today: number;
    thisWeek: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date();
    weekEnd.setDate(weekStart.getDate() + 6);

    const [total, scheduled, completed, cancelled, todayCount, weekCount] = await Promise.all([
      this.appointmentRepository.count(),
      this.appointmentRepository.count({ where: { status: AppointmentStatus.SCHEDULED } }),
      this.appointmentRepository.count({ where: { status: AppointmentStatus.COMPLETED } }),
      this.appointmentRepository.count({ where: { status: AppointmentStatus.CANCELLED } }),
      this.appointmentRepository.count({ where: { date: today } }),
      this.appointmentRepository.count({
        where: {
          date: Between(weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]),
        },
      }),
    ]);

    return {
      total,
      scheduled,
      completed,
      cancelled,
      today: todayCount,
      thisWeek: weekCount,
    };
  }
}
