import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  review(
    @Req() req: { user: { sub: string } },
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(createReviewDto, req.user.sub);
  }

  @Get(':productId')
  getReviewsForProduct(@Param('productId') productId: string) {
    return this.reviewsService.getReviewsForProduct(productId);
  }
}
