// import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateCartDto } from './create-cart.dto';

export class UpdateCartDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;
}
