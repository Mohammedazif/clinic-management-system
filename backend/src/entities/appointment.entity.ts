import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsEmail, IsPhoneNumber, IsDateString } from 'class-validator';
import { Doctor } from './doctor.entity';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  patientName: string;

  @Column()
  @IsPhoneNumber()
  patientPhone: string;

  @Column()
  @IsEmail()
  patientEmail: string;

  @Column({ nullable: true })
  patientAge: number;

  @Column({ nullable: true })
  patientGender: string;

  @Column()
  @IsDateString()
  date: string; // Format: YYYY-MM-DD

  @Column()
  @IsNotEmpty()
  time: string; // Format: HH:MM

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentPriority,
    default: AppointmentPriority.NORMAL,
  })
  priority: AppointmentPriority;

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  symptoms: string;

  @Column('text', { nullable: true })
  diagnosis: string;

  @Column('text', { nullable: true })
  prescription: string;

  @Column({ nullable: true })
  consultationFee: number;

  @Column({ default: false })
  isFollowUp: boolean;

  @Column({ nullable: true })
  followUpDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Doctor, doctor => doctor.appointments, { eager: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column()
  doctorId: string;

  // Virtual fields
  get appointmentDateTime(): Date {
    return new Date(`${this.date}T${this.time}:00`);
  }

  get isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  get isPast(): boolean {
    const now = new Date();
    const appointmentTime = this.appointmentDateTime;
    return appointmentTime < now;
  }
}
