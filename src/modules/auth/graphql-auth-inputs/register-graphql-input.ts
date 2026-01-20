import { InputType, Field } from '@nestjs/graphql';
import { SignupDto } from '../dto/register-dto';

@InputType()
export class SignupInput extends SignupDto {
  @Field()
  declare name: string;

  @Field()
  declare email: string;

  @Field()
  declare password: string;

  @Field()
  declare role: string;

  @Field(() => [String], { nullable: true })
  declare address?: string[];

  @Field({ nullable: true })
  declare phone?: string;
}
