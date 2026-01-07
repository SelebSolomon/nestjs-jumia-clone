import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user-schema';
import { Model, Types } from 'mongoose';
import { CreateUserInput } from './types/create-user.type';
import { RolesService } from '../roles/role.service';
import error from 'src/config/error.config';
import { UpdateMeDTO } from './dto/update-me-dto';
import { CreateAdminDto } from './dto/create-admin-role-dto';
import { RoleName } from '../roles/enums/roles-enums';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private roleService: RolesService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findUserByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async create(data: CreateUserInput) {
    return this.userModel.create(data);
  }

  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.role) return false;
    return this.roleService.isAdmin(user.role.toString());
  }

  async findByVerificationToken(token: string): Promise<UserDocument | null> {
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    return await this.userModel
      .findOne({
        emailVerificationToken: token,
        emailVerificationTokenExpires: expires,
      })
      .exec();
  }

  async update(
    userId: string,
    updateData: Partial<User>,
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  findUserByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async getUserRoles(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException();

    const role = await this.roleService.getRoleById(user.role.toString());
    return role?.name;
  }
  async getUserPermissions(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new BadRequestException();

    const role = await this.roleService.getRoleById(user.role.toString());
    return role?.permissions;
  }

  async findById(userId) {
    const user = await this.userModel.findById(userId);
    return user;
  }

  findUserByIdWithPassword(id: string) {
    return this.userModel.findOne({ _id: id }).select('+password').exec();
  }

  async createForgotPasswordToken(
    userId: string,
    token: string,
    expiryDate: Date,
  ) {
    return await this.userModel.findOneAndUpdate(
      { _id: userId },
      {
        passwordResetToken: token,
        passwordResetExpires: expiryDate,
      },
      { new: true },
    );
  }

  async findByPasswordResetToken(token: string) {
    return await this.userModel.findOne({
      passwordResetExpires: { $gte: new Date() },
      passwordResetToken: token,
    });
  }
  async updatePassword(userId: string, hashedPassword: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      },
      { new: true },
    );
  }

  async findByIdForRefreshToken(id: string) {
    return this.userModel.findOne({ _id: id }).select('+refreshToken').exec();
  }

  async updateRefreshToken(userId: string, hashedToken: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { refreshToken: hashedToken },
      { new: true },
    );
  }

  // THIS PART IF FOR USER CONTROLLER TAKE NOTE
  async getUserProfile(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(error.userNotFound);
    }

    const user = await this.userModel
      .findById(id)
      .where({ isActive: true })
      .select('name email role');

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException(error.userNotFound);
    }

    return {
      status: 'success',
      data: {
        user,
      },
    };
  }

  async updateMe(updateMeDto: UpdateMeDTO, userId: string) {
    // 1️⃣ Ensure user exists & is active
    const user = await this.userModel.findOne({
      _id: userId,
      isActive: true,
    });

    if (!user) {
      throw new NotFoundException(error.userNotFound);
    }

    // 2️⃣ Explicitly allow only safe fields
    const { email, name, phone } = updateMeDto;

    // 3️⃣ Update user
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { email, name, phone },
      {
        new: true,
        runValidators: true,
      },
    );

    // 4️⃣ Safety check (should rarely happen, but important)
    if (!updatedUser) {
      this.logger.error(`User ${userId} update failed`);
      throw new BadRequestException(error.validationError);
    }

    return {
      status: 'success',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
        },
      },
    };
  }

  async deleteMe(userId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      isActive: true,
    });

    if (!user) {
      throw new UnauthorizedException(error.unauthorized);
    }

    user.isActive = false;
    await user.save();

    return {
      status: 'success',
      message: 'Account deleted successfully',
    };
  }

  async adminGetUser(id: string) {
    // 1️⃣ Validate ID early
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    // 2️⃣ Fetch active user only & explicitly select safe fields
    const user = await this.userModel
      .findOne({ _id: id, isActive: true })
      .select('_id name email role');

    // 3️⃣ Handle not found
    if (!user) {
      this.logger.warn(`Admin attempted to fetch non-existing user: ${id}`);
      throw new NotFoundException(error.userNotFound);
    }

    // 4️⃣ Return sanitized response
    return {
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async findByRole(roleName: RoleName): Promise<UserDocument[]> {
    const role = await this.roleService.safeFindByName(roleName);
    if (!role) {
      return [];
    }

    // 2️⃣ Find users with that role and active status
    return await this.userModel.find({ role: role._id, isActive: true }).exec();
  }

  async createAdmin(dto: CreateAdminDto) {
    const adminRole = await this.roleService.getAdminRole();

    return this.create({
      ...dto,
      role: adminRole._id,
      emailVerified: true,
      isActive: true,
    });
  }

  async adminUpdateUser(id: string, updateUserDto: AdminUpdateUserDto) {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.error('Invalid mongoId');
      throw new BadRequestException('Invalid ID');
    }

    const user = await this.findById(id);
    if (!user) {
      this.logger.error('No user found with this ID');
      throw new NotFoundException(error.userNotFound);
    }

    // Prepare update data
    const updateData: Partial<User> = { ...updateUserDto };

    // Convert role string to ObjectId if present
    if (updateUserDto.role) {
      if (!Types.ObjectId.isValid(updateUserDto.role)) {
        throw new BadRequestException('Invalid role ID');
      }
      updateData.role = new Types.ObjectId(updateUserDto.role);
    }

    // Update the user
    const updatedUser = await this.update(id, updateData);

    // Filter only updated fields
    const updatedFields = Object.keys(updateData).reduce((acc, key) => {
      acc[key] = updatedUser[key as keyof User];
      return acc;
    }, {} as Partial<User>);

    return {
      status: 'success',
      data: {
        user: updatedFields,
      },
    };
  }
}
