import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { ProductsQuery } from '../products/interface/products-query';
import { GetCategoriesParams } from '../categories/interface/category-interface';
import { CategoriesService } from '../categories/categories.service';
import { UserQuery } from '../users/interface/user-query';
import { OrderQuery } from '../orders/interface/order-query-builder';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class AdminService {
  constructor(
    private productService: ProductsService,
    private userService: UsersService,
    private categoriesService: CategoriesService,
    private orderService: OrdersService,
  ) {}

  async getAllUsers(userId: string, query: UserQuery) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new UnauthorizedException('You are not authorized');
    }
    const users = await this.userService.adminFindAllUsers(query);
    return users;
  }

  async getAllProducts(userId: string, query: ProductsQuery) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new UnauthorizedException('You are not authorized');
    }
    const products = await this.productService.allProducts(query);
    return products;
  }

  async getAllCategories(userId: string, params: GetCategoriesParams) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new UnauthorizedException('You are not authorized');
    }

    const categories = await this.categoriesService.getCategories(params);
    return categories;
  }

  async getAllOrders(userId: string, query: OrderQuery) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new UnauthorizedException('You are not authorized');
    }

    return await this.orderService.findAllOrders(query);
  }
}
