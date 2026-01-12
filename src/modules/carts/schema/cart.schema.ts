import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

export type CartItem<T = Types.ObjectId> = {
  _id?: Types.ObjectId;
  product: T; // can be ObjectId OR ProductDocument
  quantity: number;
  priceSnapshot: number;
};

@Schema({ timestamps: true })
export class Cart {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  user: Types.ObjectId;

  @Prop([
    {
      product: {
        type: Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      priceSnapshot: {
        type: Number,
        required: true,
      },
    },
  ])
  items: CartItem[];

  @Prop({ default: 0 })
  totalPrice: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.pre<CartDocument>('save', function () {
  this.totalPrice = this.items.reduce(
    (acc, item) => acc + item.quantity * item.priceSnapshot,
    0,
  );
  //   next();
});
