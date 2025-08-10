import { QueueService } from './queue.service';
import { CreateQueueItemDto } from './dto/create-queue-item.dto';
import { UpdateQueueItemDto } from './dto/update-queue-item.dto';
import { QueueStatus, QueuePriority } from '../entities/queue-item.entity';
export declare class QueueController {
    private readonly queueService;
    constructor(queueService: QueueService);
    create(createQueueItemDto: CreateQueueItemDto): Promise<import("../entities/queue-item.entity").QueueItem>;
    findAll(status?: QueueStatus, doctorId?: string, priority?: QueuePriority, activeOnly?: string): Promise<import("../entities/queue-item.entity").QueueItem[]>;
    getStats(): Promise<{
        totalPatients: number;
        todayAppointments: number;
        queueLength: number;
        completedToday: number;
        completed: number;
        averageWaitTime: number;
        urgentPatients: number;
        escalatedPatients: number;
        availableDoctors: number;
        busyDoctors: number;
        totalDoctors: number;
        total: number;
        waiting: number;
        called: number;
        inConsultation: number;
        cancelled: number;
    }>;
    getActiveQueue(): Promise<import("../entities/queue-item.entity").QueueItem[]>;
    getWaitingQueue(): Promise<import("../entities/queue-item.entity").QueueItem[]>;
    findByQueueNumber(queueNumber: string): Promise<import("../entities/queue-item.entity").QueueItem>;
    findOne(id: string): Promise<import("../entities/queue-item.entity").QueueItem>;
    callNext(body: {
        doctorId?: string;
    }): Promise<import("../entities/queue-item.entity").QueueItem>;
    update(id: string, updateQueueItemDto: UpdateQueueItemDto): Promise<import("../entities/queue-item.entity").QueueItem>;
    updateStatus(id: string, body: {
        status: QueueStatus;
    }): Promise<import("../entities/queue-item.entity").QueueItem>;
    assignDoctor(id: string, body: {
        doctorId: string;
    }): Promise<import("../entities/queue-item.entity").QueueItem>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
