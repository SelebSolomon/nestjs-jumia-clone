import { ExecutionContext, Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { RoleModule } from './modules/roles/role.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmailsModule } from './modules/emails/emails.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BootstrapService } from './bootstrap/bootstrap.service';
import { CloudinaryService } from './modules/cloudinary/cloudinary.service';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { RedisConfig } from './config/redis.config';
import { CacheModule } from '@nestjs/cache-manager';
import { ProductsModule } from './modules/products/products.module';
import { CartsModule } from './modules/carts/carts.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { AdminModule } from './modules/admin/admin.module';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { AppRolver } from './app.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development', 
    }),
    PassportModule,
    CacheModule.registerAsync(RedisConfig),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
        connectionFactory: (connection: unknown) => {
          console.log('✅ Database connected');
          return connection;
        },
      }),
    }),

    // ThrottlerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     throttlers: [
    //       {
    //         ttl: Number(config.get('THROTTLE_TTL')),
    //         limit: Number(config.get('THROTTLE_LIMIT')),
    //         blockDuration: minutes(Number(config.get('BLOCK_DURATION'))),
    //       },
    //     ],
    //     errorMessage: 'Too many request please slow down',
    //     getTracker: (req: Record<string, any>, context: ExecutionContext) => {
    //       context: ({ req, res }) => ({ req, res });
    //       return req.ip;
    //     },
    //   }),
    // }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      autoSchemaFile: 'src/schema.gql',
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({ req, res }) => ({ req, res }),
    }),

    RoleModule,
    AuthModule,
    UsersModule,
    EmailsModule,
    CloudinaryModule,
    CategoriesModule,
    ProductsModule,
    CartsModule,
    OrdersModule,
    PaymentsModule,
    StripeModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppRolver,
    AppService,
    Logger,
    BootstrapService,
    CloudinaryService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
