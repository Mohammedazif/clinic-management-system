import { Doctor } from './doctor.entity';
export declare enum AppointmentStatus {
    SCHEDULED = "scheduled",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare enum AppointmentPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class Appointment {
    id: string;
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    patientAge: number;
    patientGender: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    priority: AppointmentPriority;
    notes: string;
    symptoms: string;
    diagnosis: string;
    prescription: string;
    consultationFee: number;
    isFollowUp: boolean;
    followUpDate: string;
    createdAt: Date;
    updatedAt: Date;
    doctor: Doctor;
    doctorId: string;
    get appointmentDateTime(): Date;
    get isToday(): boolean;
    get isPast(): boolean;
}
