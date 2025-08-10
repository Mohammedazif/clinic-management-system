import { IsNotEmpty, IsEmail, IsDateString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { AppointmentPriority } from '../../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsNotEmpty()
  patientName: string;

  @IsNotEmpty()
  patientPhone: string;

  @IsEmail()
  patientEmail: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  patientAge?: number;

  @IsOptional()
  patientGender?: string;

  @IsNotEmpty()
  doctorId: string;

  @IsDateString()
  date: string; // Format: YYYY-MM-DD

  @IsNotEmpty()
  time: string; // Format: HH:MM

  @IsOptional()
  @IsEnum(AppointmentPriority)
  priority?: AppointmentPriority;

  @IsOptional()
  notes?: string;

  @IsOptional()
  symptoms?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;
}
