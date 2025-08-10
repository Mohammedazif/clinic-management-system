import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { QueueItem, QueueStatus, QueuePriority } from '../entities/queue-item.entity';
import { Doctor } from '../entities/doctor.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { CreateQueueItemDto } from './dto/create-queue-item.dto';
import { UpdateQueueItemDto } from './dto/update-queue-item.dto';
import { DoctorsService } from '../doctors/doctors.service';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueItem)
    private queueRepository: Repository<QueueItem>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private doctorsService: DoctorsService,
  ) {}

  async create(createQueueItemDto: CreateQueueItemDto): Promise<QueueItem> {
    const { doctorId, ...queueData } = createQueueItemDto;

    // Verify doctor exists if provided
    if (doctorId) {
      const doctor = await this.doctorRepository.findOne({
        where: { id: doctorId, isActive: true },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found or inactive');
      }
    }

    // Use transaction to handle queue number generation safely with retry logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        return await this.queueRepository.manager.transaction(async (transactionalEntityManager) => {
          // Generate next queue number within transaction
          const queueNumber = await this.generateQueueNumber(transactionalEntityManager);

          const queueItem = transactionalEntityManager.create(QueueItem, {
            ...queueData,
            doctorId,
            queueNumber,
            queueDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
            status: QueueStatus.WAITING,
          });

          return transactionalEntityManager.save(queueItem);
        });
      } catch (error) {
        attempts++;
        
        // If it's a duplicate entry error and we haven't exceeded max attempts, retry
        if (error.code === 'ER_DUP_ENTRY' && attempts < maxAttempts) {
          console.log(`Queue number collision detected, retrying... (attempt ${attempts}/${maxAttempts})`);
          // Add a small delay to reduce collision probability
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          continue;
        }
        
        // If it's not a duplicate error or we've exceeded max attempts, throw the error
        throw error;
      }
    }

    throw new ConflictException('Unable to generate unique queue number after multiple attempts');
  }

  async findAll(filters?: {
    status?: QueueStatus;
    doctorId?: string;
    priority?: QueuePriority;
    activeOnly?: boolean;
  }): Promise<QueueItem[]> {
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
        activeStatuses: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION],
      });
    }

    return queryBuilder
      .orderBy('queue.priority', 'DESC')
      .addOrderBy('queue.createdAt', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<QueueItem> {
    const queueItem = await this.queueRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });

    if (!queueItem) {
      throw new NotFoundException(`Queue item with ID ${id} not found`);
    }

    return queueItem;
  }

  async findByQueueNumber(queueNumber: number): Promise<QueueItem> {
    const queueItem = await this.queueRepository.findOne({
      where: { queueNumber },
      relations: ['doctor'],
    });

    if (!queueItem) {
      throw new NotFoundException(`Queue item with number ${queueNumber} not found`);
    }

    return queueItem;
  }

  async getActiveQueue(): Promise<QueueItem[]> {
    return this.findAll({ activeOnly: true });
  }

  async getWaitingQueue(): Promise<QueueItem[]> {
    return this.findAll({ status: QueueStatus.WAITING });
  }

  async update(id: string, updateQueueItemDto: UpdateQueueItemDto): Promise<QueueItem> {
    const queueItem = await this.findOne(id);

    // If updating doctor, verify it exists
    if (updateQueueItemDto.doctorId) {
      const doctor = await this.doctorRepository.findOne({
        where: { id: updateQueueItemDto.doctorId, isActive: true },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found or inactive');
      }
    }

    Object.assign(queueItem, updateQueueItemDto);
    return this.queueRepository.save(queueItem);
  }

  async updateStatus(id: string, status: QueueStatus): Promise<QueueItem> {
    const queueItem = await this.findOne(id);
    const now = new Date();

    // Set timestamps based on status
    switch (status) {
      case QueueStatus.CALLED:
        queueItem.calledAt = now;
        break;
      case QueueStatus.IN_CONSULTATION:
        queueItem.consultationStartedAt = now;
        break;
      case QueueStatus.COMPLETED:
        if (!queueItem.consultationStartedAt) {
          queueItem.consultationStartedAt = now;
        }
        queueItem.consultationEndedAt = now;
        break;
    }

    queueItem.status = status;
    return this.queueRepository.save(queueItem);
  }

  async callNext(doctorId?: string): Promise<QueueItem | null> {
    const queryBuilder = this.queueRepository
      .createQueryBuilder('queue')
      .where('queue.status = :status', { status: QueueStatus.WAITING });

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

    // Assign doctor if not already assigned
    if (!nextInQueue.doctorId && doctorId) {
      nextInQueue.doctorId = doctorId;
    }

    return this.updateStatus(nextInQueue.id, QueueStatus.CALLED);
  }

  async assignDoctor(id: string, doctorId: string): Promise<QueueItem> {
    const queueItem = await this.findOne(id);
    
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId, isActive: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found or inactive');
    }

    queueItem.doctorId = doctorId;
    return this.queueRepository.save(queueItem);
  }

  async remove(id: string): Promise<void> {
    const queueItem = await this.findOne(id);
    await this.queueRepository.remove(queueItem);
  }

  async getQueueStats(): Promise<{
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
  }> {
    const [total, waiting, called, inConsultation, completed, cancelled] = await Promise.all([
      this.queueRepository.count(),
      this.queueRepository.count({ where: { status: QueueStatus.WAITING } }),
      this.queueRepository.count({ where: { status: QueueStatus.CALLED } }),
      this.queueRepository.count({ where: { status: QueueStatus.IN_CONSULTATION } }),
      this.queueRepository.count({ where: { status: QueueStatus.COMPLETED } }),
      this.queueRepository.count({ where: { status: QueueStatus.CANCELLED } }),
    ]);

    // Calculate average wait time for completed items today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedQueueToday = await this.queueRepository.find({
      where: {
        status: QueueStatus.COMPLETED,
        createdAt: Between(today, tomorrow),
      },
    });

    // Get completed appointments for today
    const todayDateString = new Date().toISOString().split('T')[0];
    const completedAppointmentsToday = await this.appointmentRepository.count({
      where: {
        date: todayDateString,
        status: AppointmentStatus.COMPLETED,
      },
    });

    let averageWaitTime = 0;
    if (completedQueueToday.length > 0) {
      const totalWaitTime = completedQueueToday.reduce((sum, item) => {
        if (item.consultationStartedAt) {
          const waitTime = item.consultationStartedAt.getTime() - item.createdAt.getTime();
          return sum + (waitTime / (1000 * 60)); // Convert to minutes
        }
        return sum;
      }, 0);
      averageWaitTime = Math.round(totalWaitTime / completedQueueToday.length);
    }

    // Calculate urgent and escalated patients
    const currentTime = new Date();
    const waitingItems = await this.queueRepository.find({
      where: {
        status: QueueStatus.WAITING,
        createdAt: Between(today, tomorrow),
      },
      relations: ['doctor'],
    });

    let urgentPatients = 0;
    let escalatedPatients = 0;

    waitingItems.forEach(item => {
      const waitTime = Math.floor((currentTime.getTime() - item.createdAt.getTime()) / (1000 * 60));
      
      // Count original urgent patients
      if (item.priority === QueuePriority.URGENT) {
        urgentPatients++;
      }
      
      // Count escalated patients (priority changed due to wait time)
      const originalPriority = item.priority;
      let effectivePriority = originalPriority;
      
      if (waitTime >= 90) {
        effectivePriority = QueuePriority.URGENT;
      } else if (waitTime >= 60) {
        effectivePriority = QueuePriority.HIGH;
      } else if (waitTime >= 30) {
        effectivePriority = QueuePriority.NORMAL;
      }
      
      if (effectivePriority !== originalPriority) {
        escalatedPatients++;
      }
      
      // Count effective urgent patients (original + escalated)
      if (effectivePriority === QueuePriority.URGENT) {
        urgentPatients++;
      }
    });

    // Get doctor statistics
    const doctorStats = await this.getDoctorStats();

    // Calculate comprehensive completedToday (queue completions + appointment completions)
    const totalCompletedToday = completed + completedAppointmentsToday;

    return {
      totalPatients: total,
      todayAppointments: total, // For now, using total as appointments
      queueLength: waiting,
      completedToday: totalCompletedToday, // Combined queue + appointment completions
      completed, // Keep original queue completions for backward compatibility
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

  private async getDoctorStats(): Promise<{ available: number; busy: number; total: number }> {
    const doctorStats = await this.doctorsService.getStats();
    return {
      available: doctorStats.availableDoctors,
      busy: doctorStats.busyDoctors,
      total: doctorStats.totalDoctors
    };
  }

  private async generateQueueNumber(entityManager?: any): Promise<number> {
    // Get today's date for daily queue numbering
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const repository = entityManager ? entityManager.getRepository(QueueItem) : this.queueRepository;

    const lastQueueItem = await repository
      .createQueryBuilder('queue')
      .where('queue.queueDate = :todayDate', { todayDate })
      .orderBy('queue.queueNumber', 'DESC')
      .getOne();

    return lastQueueItem ? lastQueueItem.queueNumber + 1 : 1;
  }
}
