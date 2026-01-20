import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class RegisterGraphqlQlType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  role: string;

  @Field(() => [String], { nullable: true })
  address?: string[];

  @Field({ nullable: true })
  phone?: string;
}
