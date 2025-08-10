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
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const queue_item_entity_1 = require("../entities/queue-item.entity");
const doctor_entity_1 = require("../entities/doctor.entity");
const appointment_entity_1 = require("../entities/appointment.entity");
const doctors_service_1 = require("../doctors/doctors.service");
let QueueService = class QueueService {
    constructor(queueRepository, doctorRepository, appointmentRepository, doctorsService) {
        this.queueRepository = queueRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorsService = doctorsService;
    }
    async create(createQueueItemDto) {
        const { doctorId, ...queueData } = createQueueItemDto;
        if (doctorId) {
            const doctor = await this.doctorRepository.findOne({
                where: { id: doctorId, isActive: true },
            });
            if (!doctor) {
                throw new common_1.NotFoundException('Doctor not found or inactive');
            }
        }
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
            try {
                return await this.queueRepository.manager.transaction(async (transactionalEntityManager) => {
                    const queueNumber = await this.generateQueueNumber(transactionalEntityManager);
                    const queueItem = transactionalEntityManager.create(queue_item_entity_1.QueueItem, {
                        ...queueData,
                        doctorId,
                        queueNumber,
                        queueDate: new Date().toISOString().split('T')[0],
                        status: queue_item_entity_1.QueueStatus.WAITING,
                    });
                    return transactionalEntityManager.save(queueItem);
                });
            }
            catch (error) {
                attempts++;
                if (error.code === 'ER_DUP_ENTRY' && attempts < maxAttempts) {
                    console.log(`Queue number collision detected, retrying... (attempt ${attempts}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 100 * attempts));
                    continue;
                }
                throw error;
            }
        }
        throw new common_1.ConflictException('Unable to generate unique queue number after multiple attempts');
    }
    async findAll(filters) {
        const queryBuilder = this.queueRepository
            .createQueryBuilder('queue')
            .leftJoinAndSelect('queue.doctor', 'doctor');
        if (filters?.status) {
            queryBuilder.andWhere('queue.status = :status', { status: filters.status });
        }
        if (filters?.doctorId) {
            queryBuilder.andWhere('queue.doctorId = :doctorId', { doctorId: filters.doctorId });
        }
        if (filters?.priority) {
            queryBuilder.andWhere('queue.priority = :priority', { priority: filters.priority });
        }
        if (filters?.activeOnly) {
            queryBuilder.andWhere('queue.status IN (:...activeStatuses)', {
                activeStatuses: [queue_item_entity_1.QueueStatus.WAITING, queue_item_entity_1.QueueStatus.CALLED, queue_item_entity_1.QueueStatus.IN_CONSULTATION],
            });
        }
        return queryBuilder
            .orderBy('queue.priority', 'DESC')
            .addOrderBy('queue.createdAt', 'ASC')
            .getMany();
    }
    async findOne(id) {
        const queueItem = await this.queueRepository.findOne({
            where: { id },
            relations: ['doctor'],
        });
        if (!queueItem) {
            throw new common_1.NotFoundException(`Queue item with ID ${id} not found`);
        }
        return queueItem;
    }
    async findByQueueNumber(queueNumber) {
        const queueItem = await this.queueRepository.findOne({
            where: { queueNumber },
            relations: ['doctor'],
        });
        if (!queueItem) {
            throw new common_1.NotFoundException(`Queue item with number ${queueNumber} not found`);
        }
        return queueItem;
    }
    async getActiveQueue() {
        return this.findAll({ activeOnly: true });
    }
    async getWaitingQueue() {
        return this.findAll({ status: queue_item_entity_1.QueueStatus.WAITING });
    }
    async update(id, updateQueueItemDto) {
        const queueItem = await this.findOne(id);
        if (updateQueueItemDto.doctorId) {
            const doctor = await this.doctorRepository.findOne({
                where: { id: updateQueueItemDto.doctorId, isActive: true },
            });
            if (!doctor) {
                throw new common_1.NotFoundException('Doctor not found or inactive');
            }
        }
        Object.assign(queueItem, updateQueueItemDto);
        return this.queueRepository.save(queueItem);
    }
    async updateStatus(id, status) {
        const queueItem = await this.findOne(id);
        const now = new Date();
        switch (status) {
            case queue_item_entity_1.QueueStatus.CALLED:
                queueItem.calledAt = now;
                break;
            case queue_item_entity_1.QueueStatus.IN_CONSULTATION:
                queueItem.consultationStartedAt = now;
                break;
            case queue_item_entity_1.QueueStatus.COMPLETED:
                if (!queueItem.consultationStartedAt) {
                    queueItem.consultationStartedAt = now;
                }
                queueItem.consultationEndedAt = now;
                break;
        }
        queueItem.status = status;
        return this.queueRepository.save(queueItem);
    }
    async callNext(doctorId) {
        const queryBuilder = this.queueRepository
            .createQueryBuilder('queue')
            .where('queue.status = :status', { status: queue_item_entity_1.QueueStatus.WAITING });
        if (doctorId) {
            queryBuilder.andWhere('(queue.doctorId = :doctorId OR queue.doctorId IS NULL)', { doctorId });
        }
        const nextInQueue = await queryBuilder
            .orderBy('queue.priority', 'DESC')
            .addOrderBy('queue.createdAt', 'ASC')
            .getOne();
        if (!nextInQueue) {
            return null;
        }
        if (!nextInQueue.doctorId && doctorId) {
            nextInQueue.doctorId = doctorId;
        }
        return this.updateStatus(nextInQueue.id, queue_item_entity_1.QueueStatus.CALLED);
    }
    async assignDoctor(id, doctorId) {
        const queueItem = await this.findOne(id);
        const doctor = await this.doctorRepository.findOne({
            where: { id: doctorId, isActive: true },
        });
        if (!doctor) {
            throw new common_1.NotFoundException('Doctor not found or inactive');
        }
        queueItem.doctorId = doctorId;
        return this.queueRepository.save(queueItem);
    }
    async remove(id) {
        const queueItem = await this.findOne(id);
        await this.queueRepository.remove(queueItem);
    }
    async getQueueStats() {
        const [total, waiting, called, inConsultation, completed, cancelled] = await Promise.all([
            this.queueRepository.count(),
            this.queueRepository.count({ where: { status: queue_item_entity_1.QueueStatus.WAITING } }),
            this.queueRepository.count({ where: { status: queue_item_entity_1.QueueStatus.CALLED } }),
            this.queueRepository.count({ where: { status: queue_item_entity_1.QueueStatus.IN_CONSULTATION } }),
            this.queueRepository.count({ where: { status: queue_item_entity_1.QueueStatus.COMPLETED } }),
            this.queueRepository.count({ where: { status: queue_item_entity_1.QueueStatus.CANCELLED } }),
        ]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const completedQueueToday = await this.queueRepository.find({
            where: {
                status: queue_item_entity_1.QueueStatus.COMPLETED,
                createdAt: (0, typeorm_2.Between)(today, tomorrow),
            },
        });
        const todayDateString = new Date().toISOString().split('T')[0];
        const completedAppointmentsToday = await this.appointmentRepository.count({
            where: {
                date: todayDateString,
                status: appointment_entity_1.AppointmentStatus.COMPLETED,
            },
        });
        let averageWaitTime = 0;
        if (completedQueueToday.length > 0) {
            const totalWaitTime = completedQueueToday.reduce((sum, item) => {
                if (item.consultationStartedAt) {
                    const waitTime = item.consultationStartedAt.getTime() - item.createdAt.getTime();
                    return sum + (waitTime / (1000 * 60));
                }
                return sum;
            }, 0);
            averageWaitTime = Math.round(totalWaitTime / completedQueueToday.length);
        }
        const currentTime = new Date();
        const waitingItems = await this.queueRepository.find({
            where: {
                status: queue_item_entity_1.QueueStatus.WAITING,
                createdAt: (0, typeorm_2.Between)(today, tomorrow),
            },
            relations: ['doctor'],
        });
        let urgentPatients = 0;
        let escalatedPatients = 0;
        waitingItems.forEach(item => {
            const waitTime = Math.floor((currentTime.getTime() - item.createdAt.getTime()) / (1000 * 60));
            if (item.priority === queue_item_entity_1.QueuePriority.URGENT) {
                urgentPatients++;
            }
            const originalPriority = item.priority;
            let effectivePriority = originalPriority;
            if (waitTime >= 90) {
                effectivePriority = queue_item_entity_1.QueuePriority.URGENT;
            }
            else if (waitTime >= 60) {
                effectivePriority = queue_item_entity_1.QueuePriority.HIGH;
            }
            else if (waitTime >= 30) {
                effectivePriority = queue_item_entity_1.QueuePriority.NORMAL;
            }
            if (effectivePriority !== originalPriority) {
                escalatedPatients++;
            }
            if (effectivePriority === queue_item_entity_1.QueuePriority.URGENT) {
                urgentPatients++;
            }
        });
        const doctorStats = await this.getDoctorStats();
        const totalCompletedToday = completed + completedAppointmentsToday;
        return {
            totalPatients: total,
            todayAppointments: total,
            queueLength: waiting,
            completedToday: totalCompletedToday,
            completed,
            averageWaitTime,
            urgentPatients,
            escalatedPatients,
            availableDoctors: doctorStats.available,
            busyDoctors: doctorStats.busy,
            totalDoctors: doctorStats.total,
            total,
            waiting,
            called,
            inConsultation,
            cancelled,
        };
    }
    async getDoctorStats() {
        const doctorStats = await this.doctorsService.getStats();
        return {
            available: doctorStats.availableDoctors,
            busy: doctorStats.busyDoctors,
            total: doctorStats.totalDoctors
        };
    }
    async generateQueueNumber(entityManager) {
        const todayDate = new Date().toISOString().split('T')[0];
        const repository = entityManager ? entityManager.getRepository(queue_item_entity_1.QueueItem) : this.queueRepository;
        const lastQueueItem = await repository
            .createQueryBuilder('queue')
            .where('queue.queueDate = :todayDate', { todayDate })
            .orderBy('queue.queueNumber', 'DESC')
            .getOne();
        return lastQueueItem ? lastQueueItem.queueNumber + 1 : 1;
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(queue_item_entity_1.QueueItem)),
    __param(1, (0, typeorm_1.InjectRepository)(doctor_entity_1.Doctor)),
    __param(2, (0, typeorm_1.InjectRepository)(appointment_entity_1.Appointment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        doctors_service_1.DoctorsService])
], QueueService);
//# sourceMappingURL=queue.service.js.map