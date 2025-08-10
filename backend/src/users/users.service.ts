import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'phone', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'phone', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async updateProfile(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    
    // Remove sensitive fields that shouldn't be updated via this method
    const { password, ...safeUpdateData } = updateData;
    
    Object.assign(user, safeUpdateData);
    return this.userRepository.save(user);
  }

  async deactivateUser(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async activateUser(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = true;
    await this.userRepository.save(user);
  }
}
