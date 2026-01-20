import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { EmailsModule } from '../emails/emails.module';

import { RoleModule } from '../roles/role.module';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt-strategy';
import { AuthResolver } from './auth.resolver';

@Module({
  imports: [UsersModule, EmailsModule, RoleModule],

  providers: [AuthResolver, AuthService, Logger, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
