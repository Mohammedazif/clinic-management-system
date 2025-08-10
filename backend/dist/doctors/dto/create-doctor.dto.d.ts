import { DoctorGender } from '../../entities/doctor.entity';
export declare class CreateDoctorDto {
    name: string;
    specialization: string;
    gender: DoctorGender;
    location: string;
    email: string;
    phone: string;
    availability?: string[];
    workingDays?: string[];
    licenseNumber?: string;
    experience?: number;
    bio?: string;
    consultationFee?: number;
    consultationDuration?: number;
}
