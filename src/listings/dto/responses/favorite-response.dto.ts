import { ApiProperty } from '@nestjs/swagger';
import { ListingResponseDto } from './listing-response.dto';

export class FavoriteResponseDto {
  @ApiProperty({ 
    type: Number, 
    description: 'ID записи избранного',
    example: 1 
  })
  id: number;

  @ApiProperty({ 
    type: ListingResponseDto, 
    description: 'Объявление в избранном' 
  })
  listing: ListingResponseDto;

  @ApiProperty({ 
    type: String, 
    description: 'Дата добавления в избранное (ISO8601)',
    example: '2025-01-01T12:00:00.000Z' 
  })
  createdAt: string;
}
