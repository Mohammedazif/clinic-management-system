import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Doctor } from './Doctor'

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  patientName: string

  @Column()
  patientPhone: string

  @Column()
  patientEmail: string

  @Column()
  doctorId: string

  @ManyToOne(() => Doctor, doctor => doctor.appointments)
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'time' })
  time: string

  @Column({ 
    type: 'enum', 
    enum: ['booked', 'completed', 'cancelled', 'rescheduled'],
    default: 'booked'
  })
  status: 'booked' | 'completed' | 'cancelled' | 'rescheduled'

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'text', nullable: true })
  symptoms: string

  @Column({ type: 'text', nullable: true })
  diagnosis: string

  @Column({ type: 'text', nullable: true })
  prescription: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
