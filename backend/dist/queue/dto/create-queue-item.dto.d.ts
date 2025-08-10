import { QueuePriority } from '../../entities/queue-item.entity';
export declare class CreateQueueItemDto {
    patientName: string;
    patientPhone: string;
    patientAge?: number;
    priority?: QueuePriority;
    reason?: string;
    notes?: string;
    doctorId?: string;
    estimatedWaitTime?: number;
}
