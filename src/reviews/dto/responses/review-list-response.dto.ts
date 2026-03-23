import { ApiProperty } from '@nestjs/swagger';
import { ReviewResponseDto } from './review-response.dto';

export class ReviewListResponseDto {
  @ApiProperty({ type: [ReviewResponseDto], description: 'Массив отзывов' })
  reviews: ReviewResponseDto[];

  @ApiProperty({ example: 100, description: 'Общее количество отзывов' })
  total: number;

  @ApiProperty({ example: 10, description: 'Лимит на страницу' })
  limit: number;

  @ApiProperty({ example: 0, description: 'Смещение' })
  offset: number;
}
