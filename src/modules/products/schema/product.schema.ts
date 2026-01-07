// src/modules/products/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import slugify from 'slugify';
import { Category } from 'src/modules/categories/schema/category.schema';
// import { Review } from '../../reviews/schemas/review.schema';

export type ProductDocument = Product & Document;

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true })
  thumbnail: string;

  @Prop({ required: true })
  thumbnailPublicId: string;

  @Prop([String])
  images: string[];

  @Prop([String])
  imagePublicIds: string[];

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Category | Types.ObjectId;

  @Prop({ default: 0 })
  ratings: number;

  @Prop({ unique: true })
  slug: string;

  // Virtual: reviews
  //   reviews?: Review[];

  // Virtual: stock status
  inStock?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Virtual populate for reviews
ProductSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

// Virtual field for stock status
ProductSchema.virtual('inStock').get(function (this: ProductDocument) {
  return this.stock > 0 ? 'Available' : 'Out of stock';
});

// Pre-save hook to generate slug
ProductSchema.pre('save', function (next: (err?: any) => void) {
  if (this.isModified('name')) {
    this.set('slug', slugify(this.get('name'), { lower: true }));
  }
  next();
});

// Indexes
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, price: 1 });
