import { AppointmentPriority } from '../../entities/appointment.entity';
export declare class CreateAppointmentDto {
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    patientAge?: number;
    patientGender?: string;
    doctorId: string;
    date: string;
    time: string;
    priority?: AppointmentPriority;
    notes?: string;
    symptoms?: string;
    consultationFee?: number;
}
