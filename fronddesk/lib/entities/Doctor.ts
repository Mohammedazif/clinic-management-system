import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Appointment } from './Appointment'

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  specialization: string

  @Column()
  gender: string

  @Column()
  location: string

  @Column()
  phone: string

  @Column()
  email: string

  @Column('json')
  availability: string[] // Array of available time slots like ["09:00", "10:00", "11:00"]

  @Column('json')
  workingDays: string[] // Array of working days like ["Monday", "Tuesday", "Wednesday"]

  @Column({ default: true })
  isActive: boolean

  @OneToMany(() => Appointment, appointment => appointment.doctor)
  appointments: Appointment[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
