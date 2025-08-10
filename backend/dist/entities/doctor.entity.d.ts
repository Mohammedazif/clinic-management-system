import { Appointment } from './appointment.entity';
export declare enum DoctorGender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}
export declare enum DoctorStatus {
    AVAILABLE = "available",
    BUSY = "busy",
    OFFLINE = "offline"
}
export declare class Doctor {
    id: string;
    name: string;
    specialization: string;
    gender: DoctorGender;
    location: string;
    email: string;
    phone: string;
    availability: string[];
    workingDays: string[];
    status: DoctorStatus;
    isActive: boolean;
    licenseNumber: string;
    experience: number;
    bio: string;
    consultationFee: number;
    consultationDuration: number;
    createdAt: Date;
    updatedAt: Date;
    appointments: Appointment[];
}
