import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class ForgotPasswordDto {
  @Field()
  @IsString()
  email: string;
}
