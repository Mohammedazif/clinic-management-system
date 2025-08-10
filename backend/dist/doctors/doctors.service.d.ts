import { Repository } from 'typeorm';
import { Doctor, DoctorStatus } from '../entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
export declare class DoctorsService {
    private doctorRepository;
    constructor(doctorRepository: Repository<Doctor>);
    create(createDoctorDto: CreateDoctorDto): Promise<Doctor>;
    findAll(filters?: {
        specialization?: string;
        status?: DoctorStatus;
        location?: string;
        isActive?: boolean;
    }): Promise<Doctor[]>;
    findOne(id: string): Promise<Doctor>;
    findBySpecialization(specialization: string): Promise<Doctor[]>;
    findAvailable(): Promise<Doctor[]>;
    update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor>;
    updateStatus(id: string, status: DoctorStatus): Promise<Doctor>;
    remove(id: string): Promise<void>;
    deactivate(id: string): Promise<Doctor>;
    activate(id: string): Promise<Doctor>;
    getDoctorStats(id: string): Promise<{
        totalAppointments: number;
        completedAppointments: number;
        todayAppointments: number;
        upcomingAppointments: number;
    }>;
    getStats(): Promise<{
        totalDoctors: number;
        activeDoctors: number;
        availableDoctors: number;
        busyDoctors: number;
        offlineDoctors: number;
        specializations: {
            name: string;
            count: number;
        }[];
    }>;
}
