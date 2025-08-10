import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { Doctor } from './doctor.entity';

export enum QueueStatus {
  WAITING = 'waiting',
  CALLED = 'called',
  IN_CONSULTATION = 'in_consultation',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum QueuePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('queue_items')
@Index(['queueNumber', 'queueDate'], { unique: true })
export class QueueItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  queueNumber: number;

  @Column({ type: 'date' })
  queueDate: string;

  @Column()
  @IsNotEmpty()
  patientName: string;

  @Column()
  @IsPhoneNumber()
  patientPhone: string;

  @Column({ nullable: true })
  patientAge: number;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.WAITING,
  })
  status: QueueStatus;

  @Column({
    type: 'enum',
    enum: QueuePriority,
    default: QueuePriority.NORMAL,
  })
  priority: QueuePriority;

  @Column('text', { nullable: true })
  reason: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  estimatedWaitTime: number; // in minutes

  @Column({ nullable: true })
  calledAt: Date;

  @Column({ nullable: true })
  consultationStartedAt: Date;

  @Column({ nullable: true })
  consultationEndedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Doctor, { eager: true, nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ nullable: true })
  doctorId: string;

  // Virtual fields
  get waitingTime(): number {
    if (this.status === QueueStatus.WAITING) {
      const now = new Date();
      const diffMs = now.getTime() - this.createdAt.getTime();
      return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
    }
    return 0;
  }

  get consultationDuration(): number {
    if (this.consultationStartedAt && this.consultationEndedAt) {
      const diffMs = this.consultationEndedAt.getTime() - this.consultationStartedAt.getTime();
      return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
    }
    return 0;
  }

  get isActive(): boolean {
    return [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION].includes(this.status);
  }
}
