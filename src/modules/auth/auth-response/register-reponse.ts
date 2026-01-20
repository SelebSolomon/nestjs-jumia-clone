import { Field, ObjectType } from '@nestjs/graphql';
import { RegisterGraphqlQlType } from '../graphql-auth-types/register-graphql-types';
// GRAPHQL RESPONSE TYPE
@ObjectType()
export class RegisterResponseType {
  @Field()
  status: string;

  @Field(() => RegisterGraphqlQlType)
  data: RegisterGraphqlQlType;
}

// REST API RESPONSE TYPE
export class RegisterRestResponse<T> {
  status: string;
  data: T;
}
