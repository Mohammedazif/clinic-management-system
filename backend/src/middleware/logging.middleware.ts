import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.path.includes('/appointments') && req.method === 'POST') {
      console.log('🔍 Incoming Request Debug:');
      console.log('  Method:', req.method);
      console.log('  Path:', req.path);
      console.log('  Authorization Header:', req.headers.authorization);
      console.log('  All Headers:', JSON.stringify(req.headers, null, 2));
    }
    next();
  }
}
