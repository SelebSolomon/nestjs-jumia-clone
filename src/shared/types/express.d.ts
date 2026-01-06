import { JwtPayload } from 'src/shared/interfaces/jwt.interface';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        sub: string;
        role: string;
      };
    }
  }
}

export {};
