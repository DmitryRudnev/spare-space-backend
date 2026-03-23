import { Type } from 'class-transformer';
import { Review } from '../../entities/review.entity';

export class PaginatedReviewsDto {
  @Type(() => Review)
  reviews: Review[];
  total: number;
  limit: number;
  offset: number;
}
