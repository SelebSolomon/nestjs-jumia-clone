import {
  IsArray,
  IsCurrency,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsNumber()
  @IsNotEmpty()
  price?: number;

  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  stock?: number;

  @IsString()
  @IsNotEmpty()
  thumbnail?: string;

  @IsString()
  @IsNotEmpty()
  thumbnailPublicId?: string;

  @IsArray({ each: true })
  @IsString()
  images?: string[];

  @IsArray({ each: true })
  @IsString()
  imagePublicIds?: string[];

  @IsMongoId()
  category?: string;
}
