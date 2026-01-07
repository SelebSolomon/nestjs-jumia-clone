// src/modules/categories/schemas/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import slugify from 'slugify';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ unique: true })
  slug?: string;

  @Prop()
  image?: string;

  @Prop()
  imagePublicId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parent?: Category | Types.ObjectId;

  // Virtual field: children categories
  children?: Category[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Virtual populate for children
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Pre-save hook to generate slug from name
CategorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.set('slug', slugify(this.get('name'), { lower: true }));
  }
  // no next() call at all
});

// Optional: Additional indexes for performance
CategorySchema.index({ name: 1 });
CategorySchema.index({ slug: 1 });
