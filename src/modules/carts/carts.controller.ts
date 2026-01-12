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
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { CreateCartDto } from './dto/create-cart.dto';
import { Request } from 'express';
import { UpdateCartDto } from './dto/update-cart.dto';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  addToCart(
    @Body() cartDto: CreateCartDto,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.cartsService.addToCart(req.user.sub, cartDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getCart(@Req() req: Request & { user: { sub: string } }) {
    return this.cartsService.getCart(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':itemId')
  updateCart(
    @Body() updateDto: UpdateCartDto,
    @Param('itemId') itemId: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.cartsService.updateCart(itemId, updateDto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':itemId')
  deleteAnItemFromTheCart(
    @Param('itemId') itemId: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.cartsService.deleteAnItemFromTheCart(itemId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  clearCartItems(@Req() req: Request & { user: { sub: string } }) {
    return this.cartsService.clearCartItems(req.user.sub);
  }
}
