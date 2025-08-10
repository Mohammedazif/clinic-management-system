import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsArray, IsNumber, Min } from 'class-validator';
import { DoctorGender } from '../../entities/doctor.entity';

export class CreateDoctorDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  specialization: string;

  @IsEnum(DoctorGender)
  gender: DoctorGender;

  @IsNotEmpty()
  location: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  phone: string;

  @IsArray()
  @IsOptional()
  availability?: string[];

  @IsArray()
  @IsOptional()
  workingDays?: string[];

  @IsOptional()
  licenseNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  experience?: number;

  @IsOptional()
  bio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  consultationDuration?: number;
}
