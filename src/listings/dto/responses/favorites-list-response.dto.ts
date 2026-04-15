import { ApiProperty } from '@nestjs/swagger';
import { FavoriteResponseDto } from './favorite-response.dto';

export class FavoritesListResponseDto {
  @ApiProperty({ 
    type: [FavoriteResponseDto], 
    description: 'Массив избранных объявлений' 
  })
  favorites: FavoriteResponseDto[];

  @ApiProperty({ 
    type: Number, 
    description: 'Общее количество избранных объявлений',
    example: 100 
  })
  total: number;

  @ApiProperty({ 
    type: Number, 
    description: 'Лимит на страницу',
    example: 10 
  })
  limit: number;

  @ApiProperty({ 
    type: Number, 
    description: 'Смещение',
    example: 0 
  })
  offset: number;
}
