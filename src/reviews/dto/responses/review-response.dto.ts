import { ApiProperty } from '@nestjs/swagger';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';
import { ListingResponseDto } from '../../../listings/dto/responses/listing-response.dto';

export class ReviewResponseDto {
  @ApiProperty({ example: 1, description: 'ID отзыва' })
  id: number;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Автор отзыва' })
  reviewer: UserPublicResponseDto;

  @ApiProperty({ type: ListingResponseDto, description: 'Объявление, к которому оставлен отзыв' })
  listing: ListingResponseDto;

  @ApiProperty({ example: 5, description: 'Оценка (1-5)' })
  rating: number;

  @ApiProperty({ example: 'Отличное место!', nullable: true, description: 'Текст отзыва' })
  text: string | null;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z', description: 'Дата создания' })
  createdAt: string;
}
