// // src/common/guards/authentication.guard.ts
// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { Request } from 'express';
// import error from 'src/config/error.config';

// @Injectable()
// export class AuthenticationGuard implements CanActivate {
//   constructor(private readonly jwtService: JwtService) {}

//   canActivate(context: ExecutionContext): boolean {
//     const request = context.switchToHttp().getRequest<Request>();
//     const token = this.extractTokenFromHeader(request);

//     if (!token) {
//       throw new UnauthorizedException(error.unauthorized);
//     }

//     try {
//       const payload = this.jwtService.verify(token);

//       // 🔑 attach payload to request
//       request.user = {
//         sub: payload.sub,
//         role: payload.role,
//       };

//       return true;
//     } catch {
//       throw new UnauthorizedException(error.unauthorized);
//     }
//   }

//   private extractTokenFromHeader(request: Request): string | undefined {
//     const authHeader = request.headers.authorization;
//     return authHeader?.split(' ')[1];
//   }
// }

