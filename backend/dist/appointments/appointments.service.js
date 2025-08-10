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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const appointment_entity_1 = require("../entities/appointment.entity");
const doctor_entity_1 = require("../entities/doctor.entity");
let AppointmentsService = class AppointmentsService {
    constructor(appointmentRepository, doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }
    async create(createAppointmentDto) {
        const { doctorId, date, time, ...appointmentData } = createAppointmentDto;
        const doctor = await this.doctorRepository.findOne({
            where: { id: doctorId, isActive: true },
        });
        if (!doctor) {
            throw new common_1.NotFoundException('Doctor not found or inactive');
        }
        const existingAppointment = await this.appointmentRepository.findOne({
            where: {
                doctorId,
                date,
                time,
                status: appointment_entity_1.AppointmentStatus.SCHEDULED,
            },
        });
        if (existingAppointment) {
            throw new common_1.ConflictException('Doctor already has an appointment at this time');
        }
        if (!doctor.availability.includes(time)) {
            throw new common_1.BadRequestException('Selected time is not in doctor\'s availability');
        }
        const appointment = this.appointmentRepository.create({
            ...appointmentData,
            doctorId,
            date,
            time,
            status: appointment_entity_1.AppointmentStatus.SCHEDULED,
        });
        return this.appointmentRepository.save(appointment);
    }
    async findAll(filters) {
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
    async findOne(id) {
        const appointment = await this.appointmentRepository.findOne({
            where: { id },
            relations: ['doctor'],
        });
        if (!appointment) {
            throw new common_1.NotFoundException(`Appointment with ID ${id} not found`);
        }
        return appointment;
    }
    async findByDoctor(doctorId, date) {
        const queryBuilder = this.appointmentRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('appointment.doctorId = :doctorId', { doctorId });
        if (date) {
            queryBuilder.andWhere('appointment.date = :date', { date });
        }
        return queryBuilder.orderBy('appointment.date', 'ASC').addOrderBy('appointment.time', 'ASC').getMany();
    }
    async findTodayAppointments() {
        const today = new Date().toISOString().split('T')[0];
        return this.findAll({ date: today });
    }
    async findUpcomingAppointments(days = 7) {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + days);
        return this.findAll({
            dateRange: {
                start: today.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            },
            status: appointment_entity_1.AppointmentStatus.SCHEDULED,
        });
    }
    async update(id, updateAppointmentDto) {
        const appointment = await this.findOne(id);
        if (updateAppointmentDto.doctorId || updateAppointmentDto.date || updateAppointmentDto.time) {
            const doctorId = updateAppointmentDto.doctorId || appointment.doctorId;
            const date = updateAppointmentDto.date || appointment.date;
            const time = updateAppointmentDto.time || appointment.time;
            const conflictingAppointment = await this.appointmentRepository.findOne({
                where: {
                    doctorId,
                    date,
                    time,
                    status: appointment_entity_1.AppointmentStatus.SCHEDULED,
                },
            });
            if (conflictingAppointment && conflictingAppointment.id !== id) {
                throw new common_1.ConflictException('Doctor already has an appointment at this time');
            }
        }
        Object.assign(appointment, updateAppointmentDto);
        return this.appointmentRepository.save(appointment);
    }
    async updateStatus(id, status) {
        const appointment = await this.findOne(id);
        appointment.status = status;
        const now = new Date();
        switch (status) {
            case appointment_entity_1.AppointmentStatus.IN_PROGRESS:
                break;
            case appointment_entity_1.AppointmentStatus.COMPLETED:
                break;
        }
        return this.appointmentRepository.save(appointment);
    }
    async cancel(id, reason) {
        const appointment = await this.findOne(id);
        if (appointment.status === appointment_entity_1.AppointmentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel a completed appointment');
        }
        appointment.status = appointment_entity_1.AppointmentStatus.CANCELLED;
        if (reason) {
            appointment.notes = appointment.notes ? `${appointment.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
        }
        return this.appointmentRepository.save(appointment);
    }
    async reschedule(id, newDate, newTime) {
        const appointment = await this.findOne(id);
        if (appointment.status !== appointment_entity_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Can only reschedule scheduled appointments');
        }
        const conflictingAppointment = await this.appointmentRepository.findOne({
            where: {
                doctorId: appointment.doctorId,
                date: newDate,
                time: newTime,
                status: appointment_entity_1.AppointmentStatus.SCHEDULED,
            },
        });
        if (conflictingAppointment) {
            throw new common_1.ConflictException('Doctor already has an appointment at the new time');
        }
        appointment.date = newDate;
        appointment.time = newTime;
        return this.appointmentRepository.save(appointment);
    }
    async remove(id) {
        const appointment = await this.findOne(id);
        await this.appointmentRepository.remove(appointment);
    }
    async getAppointmentStats() {
        const today = new Date().toISOString().split('T')[0];
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date();
        weekEnd.setDate(weekStart.getDate() + 6);
        const [total, scheduled, completed, cancelled, todayCount, weekCount] = await Promise.all([
            this.appointmentRepository.count(),
            this.appointmentRepository.count({ where: { status: appointment_entity_1.AppointmentStatus.SCHEDULED } }),
            this.appointmentRepository.count({ where: { status: appointment_entity_1.AppointmentStatus.COMPLETED } }),
            this.appointmentRepository.count({ where: { status: appointment_entity_1.AppointmentStatus.CANCELLED } }),
            this.appointmentRepository.count({ where: { date: today } }),
            this.appointmentRepository.count({
                where: {
                    date: (0, typeorm_2.Between)(weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]),
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
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(appointment_entity_1.Appointment)),
    __param(1, (0, typeorm_1.InjectRepository)(doctor_entity_1.Doctor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map