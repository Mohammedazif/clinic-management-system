import { IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { QueuePriority } from '../../entities/queue-item.entity';

export class CreateQueueItemDto {
  @IsNotEmpty()
  patientName: string;

  @IsNotEmpty()
  patientPhone: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  patientAge?: number;

  @IsOptional()
  @IsEnum(QueuePriority)
  priority?: QueuePriority;

  @IsOptional()
  reason?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  doctorId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedWaitTime?: number;
}
