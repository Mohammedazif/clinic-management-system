import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor, DoctorStatus } from '../entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    // Check if doctor with same email already exists
    const existingDoctor = await this.doctorRepository.findOne({
      where: { email: createDoctorDto.email },
    });

    if (existingDoctor) {
      throw new ConflictException('Doctor with this email already exists');
    }

    const doctor = this.doctorRepository.create(createDoctorDto);
    return this.doctorRepository.save(doctor);
  }

  async findAll(filters?: {
    specialization?: string;
    status?: DoctorStatus;
    location?: string;
    isActive?: boolean;
  }): Promise<Doctor[]> {
    const queryBuilder = this.doctorRepository.createQueryBuilder('doctor');

    if (filters?.specialization) {
      queryBuilder.andWhere('doctor.specialization LIKE :specialization', {
        specialization: `%${filters.specialization}%`,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('doctor.status = :status', { status: filters.status });
    }

    if (filters?.location) {
      queryBuilder.andWhere('doctor.location LIKE :location', {
        location: `%${filters.location}%`,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('doctor.isActive = :isActive', { isActive: filters.isActive });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['appointments'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: {
        specialization: Like(`%${specialization}%`),
        isActive: true,
      },
    });
  }

  async findAvailable(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      where: {
        status: DoctorStatus.AVAILABLE,
        isActive: true,
      },
    });
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);

    // Check if email is being updated and if it conflicts
    if (updateDoctorDto.email && updateDoctorDto.email !== doctor.email) {
      const existingDoctor = await this.doctorRepository.findOne({
        where: { email: updateDoctorDto.email },
      });

      if (existingDoctor) {
        throw new ConflictException('Doctor with this email already exists');
      }
    }

    Object.assign(doctor, updateDoctorDto);
    return this.doctorRepository.save(doctor);
  }

  async updateStatus(id: string, status: DoctorStatus): Promise<Doctor> {
    const doctor = await this.findOne(id);
    doctor.status = status;
    return this.doctorRepository.save(doctor);
  }

  async remove(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.doctorRepository.remove(doctor);
  }

  async deactivate(id: string): Promise<Doctor> {
    const doctor = await this.findOne(id);
    doctor.isActive = false;
    doctor.status = DoctorStatus.OFFLINE;
    return this.doctorRepository.save(doctor);
  }

  async activate(id: string): Promise<Doctor> {
    const doctor = await this.findOne(id);
    doctor.isActive = true;
    doctor.status = DoctorStatus.AVAILABLE;
    return this.doctorRepository.save(doctor);
  }

  async getDoctorStats(id: string): Promise<{
    totalAppointments: number;
    completedAppointments: number;
    todayAppointments: number;
    upcomingAppointments: number;
  }> {
    const doctor = await this.findOne(id);
    const today = new Date().toISOString().split('T')[0];

    return {
      totalAppointments: doctor.appointments?.length || 0,
      completedAppointments: doctor.appointments?.filter(apt => apt.status === 'completed').length || 0,
      todayAppointments: doctor.appointments?.filter(apt => apt.date === today).length || 0,
      upcomingAppointments: doctor.appointments?.filter(apt => 
        apt.status === 'scheduled' && new Date(apt.date) >= new Date()
      ).length || 0,
    };
  }

  async getStats(): Promise<{
    totalDoctors: number;
    activeDoctors: number;
    availableDoctors: number;
    busyDoctors: number;
    offlineDoctors: number;
    specializations: { name: string; count: number }[];
  }> {
    const totalDoctors = await this.doctorRepository.count();
    const activeDoctors = await this.doctorRepository.count({ where: { isActive: true } });
    const availableDoctors = await this.doctorRepository.count({ 
      where: { status: DoctorStatus.AVAILABLE, isActive: true } 
    });
    const busyDoctors = await this.doctorRepository.count({ 
      where: { status: DoctorStatus.BUSY, isActive: true } 
    });
    const offlineDoctors = await this.doctorRepository.count({ 
      where: { status: DoctorStatus.OFFLINE } 
    });

    // Get specialization counts
    const specializationQuery = await this.doctorRepository
      .createQueryBuilder('doctor')
      .select('doctor.specialization', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('doctor.isActive = :isActive', { isActive: true })
      .groupBy('doctor.specialization')
      .getRawMany();

    const specializations = specializationQuery.map(item => ({
      name: item.name,
      count: parseInt(item.count, 10),
    }));

    return {
      totalDoctors,
      activeDoctors,
      availableDoctors,
      busyDoctors,
      offlineDoctors,
      specializations,
    };
  }
}
