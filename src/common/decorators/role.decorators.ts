import { SetMetadata } from '@nestjs/common';
import { Permission } from 'src/modules/roles/enums/permissions-enums';
import { RoleName } from 'src/modules/roles/enums/roles-enums';

// rolename decorator
export const ROLE_KEY = 'roles';
// permission decorator
export const PERMISSION_KEY = 'permissions';

export const Roles = (roles: RoleName[]) => SetMetadata(ROLE_KEY, roles);

export const Permissions = (permissions: Permission[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
