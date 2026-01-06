// src/users/dto/signup.dto.ts
import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsMongoId,
} from 'class-validator';
import { Types } from 'mongoose';
// import { RoleName } from 'src/modules/roles/roles.enum'; // optional if you want enum roles

export class AdminUpdateUserDto {
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email: string;

  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => new Types.ObjectId(value))
  role: Types.ObjectId;

  @IsOptional()
  @IsArray({ message: 'Address must be an array of strings' })
  @ArrayUnique({ message: 'Address array must contain unique values' })
  @IsString({ each: true, message: 'Each address item must be a string' })
  address?: string[];

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;
}
