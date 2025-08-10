import { Doctor } from './doctor.entity';
export declare enum QueueStatus {
    WAITING = "waiting",
    CALLED = "called",
    IN_CONSULTATION = "in_consultation",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare enum QueuePriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class QueueItem {
    id: string;
    queueNumber: number;
    queueDate: string;
    patientName: string;
    patientPhone: string;
    patientAge: number;
    status: QueueStatus;
    priority: QueuePriority;
    reason: string;
    notes: string;
    estimatedWaitTime: number;
    calledAt: Date;
    consultationStartedAt: Date;
    consultationEndedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    doctor: Doctor;
    doctorId: string;
    get waitingTime(): number;
    get consultationDuration(): number;
    get isActive(): boolean;
}
