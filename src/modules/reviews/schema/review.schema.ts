import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true, type: String })
  review: string;

  @Prop({
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'A product must have a rating'],
  })
  rating: number;
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, ' A review must belong a user'],
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: [true, ' A review must belong a product'],
  })
  product: Types.ObjectId;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });
