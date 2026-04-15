import { ApiProperty } from '@nestjs/swagger';
import { ListingGeoResponseDto } from './listing-geo-response.dto';

export class ListingGeoListResponseDto {
  @ApiProperty({ type: [ListingGeoResponseDto], description: 'Массив объявлений' })
  listings: ListingGeoResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество объявлений', example: 100 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит на страницу', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', example: 0 })
  offset: number;
}
