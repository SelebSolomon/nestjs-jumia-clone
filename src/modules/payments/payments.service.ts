import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
// import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction, TransactionDocument } from './schema/payment.schema';
import { Model, Types } from 'mongoose';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus } from '../orders/enums/payment-status-enum';
import { ShippingStatus } from '../orders/enums/shipping-status-enum';
import { StripeService } from '../stripe/stripe.service';
import { PaymentMethod } from '../orders/enums/payment-method-enum';
import { PaymentProvider } from './enums/payment-provider';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  logger = new Logger(PaymentsService.name);
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private orderService: OrdersService,
    private stripeService: StripeService,
    private userService: UsersService,
    private configService: ConfigService, // ✅ inject config
  ) {}

  async pay(userId: string, paymentDto: CreatePaymentDto) {
    const { orderId, paymentProvider, paymentMethod } = paymentDto;

    //  Validate orderId
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    //  Validate payment method
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new BadRequestException(
        `Invalid payment method. Allowed: ${Object.values(PaymentMethod).join(', ')}`,
      );
    }

    //  Validate payment provider
    if (!Object.values(PaymentProvider).includes(paymentProvider)) {
      throw new BadRequestException(
        `Invalid payment provider. Allowed: ${Object.values(PaymentProvider).join(', ')}`,
      );
    }

    //  Enforce provider-method compatibility
    if (paymentMethod === PaymentMethod.CARD) {
      if (
        paymentProvider !== PaymentProvider.STRIPE &&
        paymentProvider !== PaymentProvider.PAYSTACK
      ) {
        throw new BadRequestException(
          'Card payments are only supported via Stripe or Paystack',
        );
      }
    }

    //  Fetch order
    const order = await this.orderService.findOrder(orderId, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    //  Order state checks
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order already paid');
    }

    if (order.shippingStatus !== ShippingStatus.PENDING) {
      throw new BadRequestException('Order cannot be paid at this stage');
    }

    if (order.products.length === 0) {
      throw new BadRequestException('Order has no products');
    }

    //  Metadata (string-only)
    const metadata: Record<string, string> = {
      orderId: order._id.toString(),
      userId: order.user.toString(),
      totalProducts: order.products.length.toString(),
    };

    if (order.paymentStatus === PaymentStatus.PROCESSING) {
      throw new BadRequestException(
        'Payment is already in progress for this order',
      );
    }

    order.paymentStatus = PaymentStatus.PROCESSING;

    await order.save();

    //  Provider switch (clean & scalable)
    switch (paymentProvider) {
      case PaymentProvider.STRIPE: {
        const paymentIntent = await this.stripeService.createPaymentIntent(
          Math.round(order.totalPrice * 100),
          'usd',
          metadata,
        );

        await this.transactionModel.create({
          user: userId,
          order: order._id,
          amount: order.totalPrice,
          currency: 'USD',
          paymentMethod,
          paymentProvider,
          paymentStatus: PaymentStatus.PENDING,
          transactionId: paymentIntent.id,
        });

        return {
          status: 'pending',
          message: 'Payment requires confirmation',
          data: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
          },
        };
      }

      case PaymentProvider.PAYSTACK:
        throw new BadRequestException('Paystack not implemented yet');

      default:
        throw new BadRequestException('Unsupported payment provider');
    }
  }

  async paymentStatus(userId: string, id: string) {
    // 1️⃣ Validate transaction ID
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID');
    }

    // 2️⃣ Check role
    const isAdmin = await this.userService.isAdmin(userId);

    // 3️⃣ Fetch payment
    const payment = await this.transactionModel.findOne(
      isAdmin
        ? { _id: id } // admin → any payment
        : { _id: id, user: userId }, // user → only own payment
    );

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // 4️⃣ Return payment status
    return {
      status: 'success',
      data: {
        payment: {
          id: payment._id,
          orderId: payment.order,
          amount: payment.amount,
          currency: payment.currency,
          paymentStatus: payment.paymentStatus,
          paymentMethod: payment.paymentMethod,
          paymentProvider: payment.paymentProvider,
          transactionId: payment.transactionId,
        },
      },
    };
  }

  async refund(userId: string, id: string) {
    // 1️⃣ Validate payment ID
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID');
    }

    // 2️⃣ Fetch the payment
    const payment = await this.transactionModel.findOne({
      _id: id,
      isActive: true,
    });

    if (!payment) {
      throw new NotFoundException('No payment found with this ID');
    }

    // 3️⃣ Check admin privileges
    const isAdmin = await this.userService.isAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    // 4️⃣ Ensure payment is actually paid
    if (payment.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException(
        'Payment is not completed or already refunded',
      );
    }

    // 5️⃣ Fetch the related order
    const order = await this.orderService.findById(payment?.order.toString());
    if (!order) {
      throw new NotFoundException('Associated order not found');
    }

    // 6️⃣ Check if order is eligible for refund
    if (order.shippingStatus !== ShippingStatus.CANCELED) {
      throw new BadRequestException('Refund only allowed for canceled');
    }

    // 7️⃣ Trigger refund via payment provider
    let refundResult;
    switch (payment.paymentProvider) {
      case PaymentProvider.STRIPE:
        refundResult = await this.stripeService.refundPayment(
          payment.transactionId,
        );
        break;
      // case PaymentProvider.PAYSTACK:
      //   refundResult = await this.paystackService.(
      //     payment.transactionId,
      //   );
      //   break;
      default:
        throw new BadRequestException('Unsupported payment provider');
    }

    // 8️⃣ Update payment record
    payment.paymentStatus = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.refundReference = refundResult.id; // ID returned by Stripe/Paystack
    await payment.save();

    // 9️⃣ Optionally update order status
    order.paymentStatus = PaymentStatus.REFUNDED;
    await order.save();

    // 🔟 Return response
    return {
      status: 'success',
      message: 'Payment refunded successfully',
      data: {
        paymentId: payment._id,
        orderId: order._id,
        refundedAt: payment.refundedAt,
        refundReference: payment.refundReference,
      },
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    // Verify webhook signature
    const event = await this.stripeService.constructWebhookEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        this.logger.log(`Refund confirmed: ${event.data.object.id}`);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  // ✅ Handle successful payment
  private async handlePaymentSuccess(paymentIntent: any) {
    const { id, metadata } = paymentIntent;

    // Find transaction by Stripe payment intent ID
    const transaction = await this.transactionModel.findOne({
      transactionId: id,
    });

    if (!transaction) {
      this.logger.warn(`No transaction found for payment intent: ${id}`);
      return;
    }

    // Update transaction status
    transaction.paymentStatus = PaymentStatus.PAID;
    transaction.paidAt = new Date();
    await transaction.save();

    // Update order status
    const order = await this.orderService.findById(
      transaction.order.toString(),
    );

    if (order) {
      order.paymentStatus = PaymentStatus.PAID;
      order.shippingStatus = ShippingStatus.PROCESSING; // move to next stage
      await order.save();
    }

    this.logger.log(`Payment succeeded for transaction: ${transaction._id}`);
  }

  // ✅ Handle failed payment
  private async handlePaymentFailed(paymentIntent: any) {
    const { id } = paymentIntent;

    const transaction = await this.transactionModel.findOne({
      transactionId: id,
    });

    if (!transaction) {
      this.logger.warn(`No transaction found for failed payment: ${id}`);
      return;
    }

    transaction.paymentStatus = PaymentStatus.FAILED;
    await transaction.save();

    const order = await this.orderService.findById(
      transaction.order.toString(),
    );

    if (order) {
      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();
    }

    this.logger.log(`Payment failed for transaction: ${transaction._id}`);
  }
}
