// src/modules/roles/roles.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { RoleName } from './enums/roles-enums';
import { Permission } from './enums/permissions-enums';
import { CreateRoleDto } from './dto/role-dto';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}
  /**
   * Get admin role - used when creating admin users
   */
  async getAdminRole(): Promise<RoleDocument> {
    try {
      return await this.findByName(RoleName.Admin);
    } catch (error) {
      return await this.createAdminRole();
    }
  }

  /**
   * Create admin role if it doesn't exist
   */
  private async createAdminRole(): Promise<RoleDocument> {
    const adminRole = new this.roleModel({
      name: RoleName.Admin,
      permissions: [
        Permission.CreateUser,
        Permission.DeleteUser,
        Permission.CreateProduct,
        Permission.UpdateProduct,
        Permission.BuyProduct,
      ],
    });

    return await adminRole.save();
  }

  /**
   * Find role by name - used during user registration
   */
  async findByName(roleName: RoleName): Promise<RoleDocument> {
    const role = await this.roleModel.findOne({ name: roleName }).exec();

    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    return role;
  }
  // ANOTHER FIND MY NAME FOR DEFAULT ADMIN
  async safeFindByName(roleName: RoleName): Promise<RoleDocument | null> {
    const role = await this.roleModel.findOne({ name: roleName }).exec();
    return role || null;
  }

  /**
   * Get default customer role - main method for registration
   */
  async getDefaultCustomerRole(): Promise<RoleDocument> {
    try {
      return await this.findByName(RoleName.Customer);
    } catch (error) {
      // If customer role doesn't exist, create it
      return await this.createDefaultCustomerRole();
    }
  }

  // GET ROLE BY ID
  async getRoleById(roleId) {
    return await this.roleModel.findById(roleId);
  }

  /**
   * Create default customer role if it doesn't exist
   */
  private async createDefaultCustomerRole(): Promise<RoleDocument> {
    const customerRole = new this.roleModel({
      name: RoleName.Customer,
      permissions: [Permission.BuyProduct],
    });

    return await customerRole.save();
  }

  /**
   * Create a new role
   */
  async create(createRoleDto: CreateRoleDto): Promise<RoleDocument> {
    const existingRole = await this.roleModel
      .findOne({
        name: createRoleDto.name,
      })
      .exec();

    if (existingRole) {
      throw new ConflictException(
        `Role '${createRoleDto.name}' already exists`,
      );
    }

    const newRole = new this.roleModel(createRoleDto);
    return await newRole.save();
  }

  /**
   * Get all roles
   */
  async findAll(): Promise<RoleDocument[]> {
    return await this.roleModel.find().exec();
  }

  /**
   * Initialize default roles - run on app startup
   */
  async seedDefaultRoles(): Promise<void> {
    const defaultRoles = [
      {
        name: RoleName.Customer,
        permissions: [Permission.BuyProduct],
      },
      {
        name: RoleName.Seller,
        permissions: [
          Permission.BuyProduct,
          Permission.CreateProduct,
          Permission.UpdateProduct,
        ],
      },
      {
        name: RoleName.Admin,
        permissions: [
          Permission.CreateUser,
          Permission.DeleteUser,
          Permission.CreateProduct,
          Permission.UpdateProduct,
          Permission.BuyProduct,
        ],
      },
    ];

    for (const roleData of defaultRoles) {
      const exists = await this.roleModel
        .findOne({ name: roleData.name })
        .exec();

      if (!exists) {
        const role = new this.roleModel(roleData);
        await role.save();
        console.log(`✓ Created default role: ${roleData.name}`);
      }
    }
  }
}
