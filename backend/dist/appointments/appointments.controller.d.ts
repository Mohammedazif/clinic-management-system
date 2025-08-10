import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '../entities/appointment.entity';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    create(createAppointmentDto: CreateAppointmentDto): Promise<import("../entities/appointment.entity").Appointment>;
    findAll(doctorId?: string, date?: string, status?: AppointmentStatus, patientName?: string, startDate?: string, endDate?: string): Promise<import("../entities/appointment.entity").Appointment[]>;
    getStats(): Promise<{
        total: number;
        scheduled: number;
        completed: number;
        cancelled: number;
        today: number;
        thisWeek: number;
    }>;
    getTodayAppointments(): Promise<import("../entities/appointment.entity").Appointment[]>;
    getUpcomingAppointments(days?: string): Promise<import("../entities/appointment.entity").Appointment[]>;
    findByDoctor(doctorId: string, date?: string): Promise<import("../entities/appointment.entity").Appointment[]>;
    findOne(id: string): Promise<import("../entities/appointment.entity").Appointment>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<import("../entities/appointment.entity").Appointment>;
    updateStatus(id: string, body: {
        status: AppointmentStatus;
    }): Promise<import("../entities/appointment.entity").Appointment>;
    cancel(id: string, body: {
        reason?: string;
    }): Promise<import("../entities/appointment.entity").Appointment>;
    reschedule(id: string, body: {
        date: string;
        time: string;
    }): Promise<import("../entities/appointment.entity").Appointment>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
