import { Review } from '../../entities/review.entity';
import { ReviewResponseDto } from '../dto/responses/review-response.dto';
import { ReviewListResponseDto } from '../dto/responses/review-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';
import { ListingMapper } from '../../listings/mappers/listing.mapper';

export class ReviewMapper {
  static toResponseDto(review: Review): ReviewResponseDto {
    const dto = new ReviewResponseDto();
    dto.id = review.id;
    dto.reviewer = UserMapper.toPublicResponseDto(review.reviewer);
    dto.listing = ListingMapper.toResponseDto(review.booking.listing);
    dto.rating = review.rating;
    dto.text = review.text;
    dto.createdAt = review.createdAt.toISOString();
    return dto;
  }

  static toListResponseDto(
    reviews: Review[],
    total: number,
    limit: number,
    offset: number,
  ): ReviewListResponseDto {
    const dto = new ReviewListResponseDto();
    dto.reviews = reviews.map(r => this.toResponseDto(r));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
    return dto;
  }
}
