import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('queue_items')
export class QueueItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  queueNumber: number

  @Column()
  patientName: string

  @Column()
  patientPhone: string

  @Column({ 
    type: 'enum', 
    enum: ['waiting', 'with_doctor', 'completed', 'cancelled'],
    default: 'waiting'
  })
  status: 'waiting' | 'with_doctor' | 'completed' | 'cancelled'

  @Column({ 
    type: 'enum', 
    enum: ['normal', 'urgent'],
    default: 'normal'
  })
  priority: 'normal' | 'urgent'

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'datetime', nullable: true })
  calledAt: Date

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
