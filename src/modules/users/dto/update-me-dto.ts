import { IsString } from 'class-validator';

export class UpdateMeDTO {
  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;
}
