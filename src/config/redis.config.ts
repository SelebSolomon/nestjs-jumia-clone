import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

export const RedisConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    store: await redisStore({
      socket: {
        host: 'redis',
        port: 6379,
      },
    }),
    ttl: 30,
  }),
  inject: [ConfigService],
};
