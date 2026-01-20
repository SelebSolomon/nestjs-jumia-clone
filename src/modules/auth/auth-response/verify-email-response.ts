import { Field, ObjectType } from '@nestjs/graphql';
import { VerifyEmailGraphqlQlType } from '../graphql-auth-types/verify-email-types';

// graphql
@ObjectType()
export class VerifyEmailResponseType {
  @Field()
  status: string;

  @Field(() => VerifyEmailGraphqlQlType)
  data: VerifyEmailGraphqlQlType;
}

// restAPi
export class VerifyEmailRestResponse {
  status?: string;
  message: string;
}
