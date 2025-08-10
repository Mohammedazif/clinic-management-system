import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: any) {
    console.log('🔍 JWT Strategy - Validating payload:', payload);
    console.log('🔍 JWT Strategy - User ID from payload:', payload.sub);
    
    const user = await this.authService.validateUser(payload.sub);
    console.log('🔍 JWT Strategy - User found:', !!user);
    
    if (!user) {
      console.log('❌ JWT Strategy - User validation failed');
      throw new UnauthorizedException();
    }
    
    console.log('✅ JWT Strategy - User validated successfully');
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
