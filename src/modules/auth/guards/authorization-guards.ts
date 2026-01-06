// src/common/guards/authorization.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/modules/users/users.service';
import { Permission } from 'src/modules/roles/enums/permissions-enums';
import { RoleName } from 'src/modules/roles/enums/roles-enums';
import {
  PERMISSION_KEY,
  ROLE_KEY,
} from 'src/common/decorators/role.decorators';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // ✅ Must be authenticated
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // 🔹 Get required roles & permissions metadata
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 🔹 Fetch user roles & permissions from DB
    const userRoles = await this.usersService.getUserRoles(userId);
    const userPermissions = await this.usersService.getUserPermissions(userId);

    // 🔹 Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => userRoles?.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role');
      }
    }

    // 🔹 Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((perm) =>
        userPermissions?.includes(perm),
      );
      if (!hasAllPermissions) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true; // ✅ Access granted
  }
}
