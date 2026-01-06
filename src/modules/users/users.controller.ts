import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
// import { AuthenticationGuard } from '../auth/guards/authentication-guards';
import { Request } from 'express';
import { UpdateMeDTO } from './dto/update-me-dto';
import { AuthorizationGuard } from '../auth/guards/authorization-guards';
import { RoleName } from '../roles/enums/roles-enums';
import { Permissions, Roles } from 'src/common/decorators/role.decorators';
import { Permission } from '../roles/enums/permissions-enums';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { CreateAdminDto } from './dto/create-admin-role-dto';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';

@Controller('users')
export class UsersController {
  constructor(
    private logger: Logger,
    private userservice: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  GetUserProfile(@Req() req: Request & { user: { sub: string } }) {
    this.logger.log('get user profile route');
    console.log('entered');
    return this.userservice.getUserProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-me')
  updateMe(
    @Body() updateMeDto: UpdateMeDTO,
    @Req() req: Request & { user: { sub: string } },
  ) {
    this.logger.log('update user profile route');
    return this.userservice.updateMe(updateMeDto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-me')
  deleteMe(@Req() req: Request & { user: { sub: string } }) {
    return this.userservice.deleteMe(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin])
  @Permissions([Permission.BuyProduct])
  @Get(':id')
  adminGetUser(@Param('id') id: string) {
    return this.userservice.adminGetUser(id);
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin])
  @Permissions([Permission.BuyProduct])
  @Patch(':id')
  adminUpdateUser(
    @Param('id') id: string,
    @Body() adminUpdateUser: AdminUpdateUserDto,
  ) {
    return this.userservice.adminUpdateUser(id, adminUpdateUser);
  }

  //   this runs by default... dont need postman testing because its on moduleinit bootstrap
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin])
  @Post('admin')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.userservice.createAdmin(dto);
  }
}
