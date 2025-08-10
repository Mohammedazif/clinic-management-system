import { IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  username: string; // Can be username or email

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
