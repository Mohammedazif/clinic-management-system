import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsEmail, IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { Appointment } from './appointment.entity';

export enum DoctorGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum DoctorStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column()
  @IsNotEmpty()
  specialization: string;

  @Column({
    type: 'enum',
    enum: DoctorGender,
  })
  gender: DoctorGender;

  @Column()
  @IsNotEmpty()
  location: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsPhoneNumber()
  phone: string;

  @Column('json')
  availability: string[]; // Array of time slots like ['09:00', '10:00', '11:00']

  @Column('json')
  workingDays: string[]; // Array of days like ['Monday', 'Tuesday', 'Wednesday']

  @Column({
    type: 'enum',
    enum: DoctorStatus,
    default: DoctorStatus.AVAILABLE,
  })
  status: DoctorStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  experience: number; // Years of experience

  @Column('text', { nullable: true })
  bio: string;

  @Column({ nullable: true })
  consultationFee: number;

  @Column({ default: 30 })
  consultationDuration: number; // Duration in minutes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Appointment, appointment => appointment.doctor)
  appointments: Appointment[];
}
