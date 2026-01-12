import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  constructor(@Inject('STRIPE_CLIENT') private readonly stripe: Stripe) {}

  async createPaymentIntent(
    amount: number,
    currency = 'usd',
    metadata?: { [key: string]: string }, // <-- must be string key/value
  ) {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });
  }

  async refundPayment(paymentIntentId: string) {
    return this.stripe.refunds.create({ payment_intent: paymentIntentId });
  }

  async constructWebhookEvent(
    payload: Buffer, // raw body from request
    sig: string, // stripe-signature header
    endpointSecret: string, // your webhook secret
  ): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${(err as Error).message}`);
    }
  }
}
