// src/bootstrap/bootstrap.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { RoleName } from '../modules/roles/enums/roles-enums';
import * as bcrypt from 'bcrypt';
import { RolesService } from 'src/modules/roles/role.service';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
  ) {}
/////
  async onModuleInit() {
    try {
      const admins = await this.usersService.findByRole(RoleName.Admin);
      if (admins.length === 0) {
        const adminRole = await this.rolesService.getAdminRole();
        const hashedPassword = await bcrypt.hash(
          process.env.FIRST_ADMIN_PASSWORD || 'Admin@123',
          10,
        );

        await this.usersService.create({
          name: process.env.FIRST_ADMIN_NAME || 'Super Admin',
          email: process.env.FIRST_ADMIN_EMAIL || 'admin@example.com',
          password: hashedPassword,
          role: adminRole._id,
          isActive: true,
          emailVerified: true,
        });

        this.logger.log('✅ First admin created');
      }
    } catch (error) {
      this.logger.error('Failed to create first admin', error);
    }
  }
}
