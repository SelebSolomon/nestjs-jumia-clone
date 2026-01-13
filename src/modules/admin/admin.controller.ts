import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { Roles } from 'src/common/decorators/role.decorators';
import { RoleName } from '../roles/enums/roles-enums';

@UseGuards(JwtAuthGuard)
@Roles([RoleName.Admin])
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers(
    @Req() req: Request & { user: { sub: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(req.user.sub, {
      page,
      limit,
      status,
      search,
    });
  }

  @Get('products')
  getAllProducts(
    @Req() req: Request & { user: { sub: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('fields') fields?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllProducts(req.user.sub, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort,
      fields,
      search,
    });
  }

  @Get('categories')
  async getAllCategories(
    @Req() req: Request & { user: { sub: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('fields') fields?: string,
    @Query('search') search?: string,
    @Query('parent') parent?: string,
  ) {
    return this.adminService.getAllCategories(req.user.sub, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort,
      fields,
      search,
      parent,
    });
  }

  @Get('orders')
  async getAllOrders(
    @Req() req: Request & { user: { sub: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('shippingStatus') shippingStatus?: string,
  ) {
    return this.adminService.getAllOrders(req.user.sub, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort,
      paymentStatus,
      shippingStatus,
    });
  }
}
