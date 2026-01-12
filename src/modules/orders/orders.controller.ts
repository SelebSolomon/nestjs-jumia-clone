import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { Request } from 'express';
import { CreateOrderDto } from './dto/create-order-dto';
import { OrderQuery } from './interface/order-query-builder';
import { filter } from 'rxjs';
import { UpdateOrderDto } from './dto/update-order-dto';
import { Roles } from 'src/common/decorators/role.decorators';
import { RoleName } from '../roles/enums/roles-enums';
import { UpdateShippingStatusDto } from './dto/update-shipping-status-dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.ordersService.createOrder(req.user.sub, createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getOrder(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('sort') sort: string,
    @Query('paymentStatus') paymentStatus: string,
    @Query('shippingStatus') shippingStatus: string,

    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.ordersService.getOrder(req.user.sub, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort,
      paymentStatus,
      shippingStatus,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  getSingleOrder(
    @Param('orderId') orderId: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.ordersService.getSingleOrder(orderId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/cancel')
  cancelOrder(
    @Body() updateOrderDto: UpdateOrderDto,
    @Param('orderId') orderId: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.ordersService.cancelOrder(
      orderId,
      req.user.sub,
      updateOrderDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Roles([RoleName.Admin])
  @Patch(':orderId/status')
  adminUpdateStatus(
    @Param('orderId') orderId: string,
    @Req() req: Request & { user: { sub: string } },
    @Body() updateShippingStatusDto: UpdateShippingStatusDto,
  ) {
    return this.ordersService.adminUpdateStatus(
      orderId,
      req.user.sub,
      updateShippingStatusDto,
    );
  }
}
