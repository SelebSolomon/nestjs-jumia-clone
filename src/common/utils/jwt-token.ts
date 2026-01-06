import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/shared/interfaces/jwt.interface';

export const signAccessToken = async (
  jwtService: JwtService,
  userId: string,
  role: string,
): Promise<string> => {
  const payload: JwtPayload = {
    sub: userId,
    role,
  };

  return jwtService.signAsync(payload, {
    expiresIn: '30m',
  });
};

export const signRefreshToken = async (
  jwtService: JwtService,
  userId: string,
): Promise<string> => {
  const payload = {
    sub: userId,
    type: 'refresh',
  };

  return jwtService.signAsync(payload, {
    expiresIn: '7d',
    secret: process.env.JWT_REFRESH_SECRET, // 🔑 use a separate  secret for refresh tokens
  });
};
