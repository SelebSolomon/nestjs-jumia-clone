import { Module, Global } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    StripeService,
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const stripeKey = configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeKey) {
          throw new Error(
            'STRIPE_SECRET_KEY is not set in environment variables!',
          );
        }
        return new Stripe(stripeKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: [StripeService],
})
export class StripeModule {}
