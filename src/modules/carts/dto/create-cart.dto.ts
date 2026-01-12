import {
  IsMongoId,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsMongoId()
  product: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @IsNumber()
  @IsPositive()
  priceSnapshot: number;
}

export class CreateCartDto {
  @IsMongoId()
  user: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items?: CartItemDto[];
}
