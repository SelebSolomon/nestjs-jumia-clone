// src/users/dto/signup.dto.ts
import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsMongoId,
  IsNotEmpty,
  IsStrongPassword,
  Matches,
} from 'class-validator';
// import { RoleName } from 'src/modules/roles/roles.enum'; // optional if you want enum roles

export class SignupDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty()
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty()
  @IsStrongPassword()
  @Matches(/^(?=.*[0-9])/, {
    message: 'password must contain at least one number',
  })
  password: string;

  @IsMongoId({ message: 'Role must be a valid role ID' })
  role: string; // Reference to Role ObjectId

  @IsOptional()
  @IsArray({ message: 'Address must be an array of strings' })
  @ArrayUnique({ message: 'Address array must contain unique values' })
  @IsString({ each: true, message: 'Each address item must be a string' })
  address?: string[];

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;
}
