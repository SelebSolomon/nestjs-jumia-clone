import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class VerifyEmailGraphqlQlType {
  @Field()
  message: string;
}
