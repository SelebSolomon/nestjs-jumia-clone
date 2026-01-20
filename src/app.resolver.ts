import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AppRolver {
  @Query(() => String)
  health() {
    return 'ok';
  }
}
