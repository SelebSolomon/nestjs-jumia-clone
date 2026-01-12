// reviews/reviews.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './schema/review.schema';
import { Order } from '../orders/schema/order-schema';
import { Product } from '../products/schema/product.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<Review>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async createReview(dto: CreateReviewDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const productObjectId = new Types.ObjectId(dto.productId);

    // 1️⃣ Verify user purchased AND paid for the product
    const order = await this.orderModel.findOne({
      user: userObjectId,
      paymentStatus: 'PAID',
      'items.product': productObjectId,
    });

    if (!order) {
      throw new ForbiddenException(
        'You can only review products you purchased',
      );
    }

    // 2️⃣ Prevent duplicate review
    const existingReview = await this.reviewModel.findOne({
      user: userObjectId,
      product: productObjectId,
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // 3️⃣ Create review
    const review = await this.reviewModel.create({
      user: userObjectId,
      product: productObjectId,
      rating: dto.rating,
      review: dto.review,
    });

    // 4️⃣ Update product rating
    await this.productModel.findByIdAndUpdate(productObjectId, {
      $inc: {
        ratings: 1,
        numberOfReviews: dto.rating,
      },
    });

    return {
      success: true,
      message: 'Review submitted successfully',
      review,
    };
  }

  async getReviewsForProduct(productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const reviews = await this.reviewModel
      .find({ product: productId })
      .populate('user', 'name avatar') // keep it light
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    return {
      success: true,
      productId,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      reviews,
    };
  }
}
