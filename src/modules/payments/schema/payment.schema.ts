import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod } from 'src/modules/orders/enums/payment-method-enum';
import { PaymentStatus } from 'src/modules/orders/enums/payment-status-enum';
import { PaymentProvider } from '../enums/payment-provider';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  // 1️⃣ Link to the user making the payment
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // 2️⃣ Link to the order
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  // 3️⃣ Amount paid
  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  currency: string;

  // 4️⃣ Payment method (card, wallet, cash on delivery, etc.)
  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentProvider),
    required: true,
  })
  paymentProvider: PaymentProvider;

  // 5️⃣ Payment status (pending, success, failed)
  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  // 6️⃣ Payment gateway transaction reference ID
  @Prop()
  transactionId: string;

  @Prop()
  paidAt: Date;

  // 7️⃣ Optional failure reason
  @Prop()
  failureReason: string;

  @Prop()
  refundedAt: Date;

  @Prop()
  refundReference: string;

  // 8️⃣ Soft delete if needed (optional)
  @Prop({ default: true })
  isActive: boolean;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
