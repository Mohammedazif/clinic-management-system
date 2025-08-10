import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
export declare class AppointmentsService {
    private appointmentRepository;
    private doctorRepository;
    constructor(appointmentRepository: Repository<Appointment>, doctorRepository: Repository<Doctor>);
    create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment>;
    findAll(filters?: {
        doctorId?: string;
        date?: string;
        status?: AppointmentStatus;
        patientName?: string;
        dateRange?: {
            start: string;
            end: string;
        };
    }): Promise<Appointment[]>;
    findOne(id: string): Promise<Appointment>;
    findByDoctor(doctorId: string, date?: string): Promise<Appointment[]>;
    findTodayAppointments(): Promise<Appointment[]>;
    findUpcomingAppointments(days?: number): Promise<Appointment[]>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment>;
    updateStatus(id: string, status: AppointmentStatus): Promise<Appointment>;
    cancel(id: string, reason?: string): Promise<Appointment>;
    reschedule(id: string, newDate: string, newTime: string): Promise<Appointment>;
    remove(id: string): Promise<void>;
    getAppointmentStats(): Promise<{
        total: number;
        scheduled: number;
        completed: number;
        cancelled: number;
        today: number;
        thisWeek: number;
    }>;
}
