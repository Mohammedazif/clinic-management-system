import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorStatus } from '../entities/doctor.entity';
export declare class DoctorsController {
    private readonly doctorsService;
    constructor(doctorsService: DoctorsService);
    create(createDoctorDto: CreateDoctorDto): Promise<import("../entities/doctor.entity").Doctor>;
    findAll(specialization?: string, status?: DoctorStatus, location?: string, isActive?: string): Promise<import("../entities/doctor.entity").Doctor[]>;
    findAvailable(): Promise<import("../entities/doctor.entity").Doctor[]>;
    findBySpecialization(specialization: string): Promise<import("../entities/doctor.entity").Doctor[]>;
    findOne(id: string): Promise<import("../entities/doctor.entity").Doctor>;
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
    update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<import("../entities/doctor.entity").Doctor>;
    updateStatus(id: string, body: {
        status: DoctorStatus;
    }): Promise<import("../entities/doctor.entity").Doctor>;
    activate(id: string): Promise<import("../entities/doctor.entity").Doctor>;
    deactivate(id: string): Promise<import("../entities/doctor.entity").Doctor>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
