import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod } from '../enums/payment-method-enum';
import { PaymentStatus } from '../enums/payment-status-enum';
import { ShippingStatus } from '../enums/shipping-status-enum';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderProduct {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  nameSnapshot: string;

  @Prop()
  imageSnapshot: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ required: true })
  price: number;
}

export const OrderProductSchema = SchemaFactory.createForClass(OrderProduct);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [OrderProductSchema], required: true })
  products: OrderProduct[];

  @Prop({ required: true })
  totalPrice: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: Object.values(ShippingStatus),
    default: ShippingStatus.PENDING,
  })
  shippingStatus: ShippingStatus;

  @Prop()
  transactionId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop()
  canceledAt: Date;

  @Prop()
  canceledReason: string;

  @Prop()
  paidAt: Date;
  @Prop()
  shippedAt: Date;

  @Prop()
  deliveredAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.pre('save', function () {
  this.totalPrice = this.products.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
});
