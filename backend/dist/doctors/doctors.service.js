"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const doctor_entity_1 = require("../entities/doctor.entity");
let DoctorsService = class DoctorsService {
    constructor(doctorRepository) {
        this.doctorRepository = doctorRepository;
    }
    async create(createDoctorDto) {
        const existingDoctor = await this.doctorRepository.findOne({
            where: { email: createDoctorDto.email },
        });
        if (existingDoctor) {
            throw new common_1.ConflictException('Doctor with this email already exists');
        }
        const doctor = this.doctorRepository.create(createDoctorDto);
        return this.doctorRepository.save(doctor);
    }
    async findAll(filters) {
        const queryBuilder = this.doctorRepository.createQueryBuilder('doctor');
        if (filters?.specialization) {
            queryBuilder.andWhere('doctor.specialization LIKE :specialization', {
                specialization: `%${filters.specialization}%`,
            });
        }
        if (filters?.status) {
            queryBuilder.andWhere('doctor.status = :status', { status: filters.status });
        }
        if (filters?.location) {
            queryBuilder.andWhere('doctor.location LIKE :location', {
                location: `%${filters.location}%`,
            });
        }
        if (filters?.isActive !== undefined) {
            queryBuilder.andWhere('doctor.isActive = :isActive', { isActive: filters.isActive });
        }
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const doctor = await this.doctorRepository.findOne({
            where: { id },
            relations: ['appointments'],
        });
        if (!doctor) {
            throw new common_1.NotFoundException(`Doctor with ID ${id} not found`);
        }
        return doctor;
    }
    async findBySpecialization(specialization) {
        return this.doctorRepository.find({
            where: {
                specialization: (0, typeorm_2.Like)(`%${specialization}%`),
                isActive: true,
            },
        });
    }
    async findAvailable() {
        return this.doctorRepository.find({
            where: {
                status: doctor_entity_1.DoctorStatus.AVAILABLE,
                isActive: true,
            },
        });
    }
    async update(id, updateDoctorDto) {
        const doctor = await this.findOne(id);
        if (updateDoctorDto.email && updateDoctorDto.email !== doctor.email) {
            const existingDoctor = await this.doctorRepository.findOne({
                where: { email: updateDoctorDto.email },
            });
            if (existingDoctor) {
                throw new common_1.ConflictException('Doctor with this email already exists');
            }
        }
        Object.assign(doctor, updateDoctorDto);
        return this.doctorRepository.save(doctor);
    }
    async updateStatus(id, status) {
        const doctor = await this.findOne(id);
        doctor.status = status;
        return this.doctorRepository.save(doctor);
    }
    async remove(id) {
        const doctor = await this.findOne(id);
        await this.doctorRepository.remove(doctor);
    }
    async deactivate(id) {
        const doctor = await this.findOne(id);
        doctor.isActive = false;
        doctor.status = doctor_entity_1.DoctorStatus.OFFLINE;
        return this.doctorRepository.save(doctor);
    }
    async activate(id) {
        const doctor = await this.findOne(id);
        doctor.isActive = true;
        doctor.status = doctor_entity_1.DoctorStatus.AVAILABLE;
        return this.doctorRepository.save(doctor);
    }
    async getDoctorStats(id) {
        const doctor = await this.findOne(id);
        const today = new Date().toISOString().split('T')[0];
        return {
            totalAppointments: doctor.appointments?.length || 0,
            completedAppointments: doctor.appointments?.filter(apt => apt.status === 'completed').length || 0,
            todayAppointments: doctor.appointments?.filter(apt => apt.date === today).length || 0,
            upcomingAppointments: doctor.appointments?.filter(apt => apt.status === 'scheduled' && new Date(apt.date) >= new Date()).length || 0,
        };
    }
    async getStats() {
        const totalDoctors = await this.doctorRepository.count();
        const activeDoctors = await this.doctorRepository.count({ where: { isActive: true } });
        const availableDoctors = await this.doctorRepository.count({
            where: { status: doctor_entity_1.DoctorStatus.AVAILABLE, isActive: true }
        });
        const busyDoctors = await this.doctorRepository.count({
            where: { status: doctor_entity_1.DoctorStatus.BUSY, isActive: true }
        });
        const offlineDoctors = await this.doctorRepository.count({
            where: { status: doctor_entity_1.DoctorStatus.OFFLINE }
        });
        const specializationQuery = await this.doctorRepository
            .createQueryBuilder('doctor')
            .select('doctor.specialization', 'name')
            .addSelect('COUNT(*)', 'count')
            .where('doctor.isActive = :isActive', { isActive: true })
            .groupBy('doctor.specialization')
            .getRawMany();
        const specializations = specializationQuery.map(item => ({
            name: item.name,
            count: parseInt(item.count, 10),
        }));
        return {
            totalDoctors,
            activeDoctors,
            availableDoctors,
            busyDoctors,
            offlineDoctors,
            specializations,
        };
    }
};
exports.DoctorsService = DoctorsService;
exports.DoctorsService = DoctorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(doctor_entity_1.Doctor)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DoctorsService);
//# sourceMappingURL=doctors.service.js.map