// src/modules/categories/dto/create-category.dto.ts

import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  // Image URL returned from Cloudinary
  @IsOptional()
  @IsString()
  image?: string;

  // Cloudinary public_id (used for delete/replace)
  @IsOptional()
  @IsString()
  imagePublicId?: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;
}
