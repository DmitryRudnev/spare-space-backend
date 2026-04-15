import { Favorite } from '../../entities/favorite.entity';
import { FavoriteResponseDto } from '../dto/responses/favorite-response.dto';
import { FavoritesListResponseDto } from '../dto/responses/favorites-list-response.dto';
import { ListingMapper } from '../../listings/mappers/listing.mapper';

export class FavoriteMapper {
  static toResponseDto(favorite: Favorite): FavoriteResponseDto {
    const dto = new FavoriteResponseDto();
    
    dto.id = favorite.id;
    dto.listing = ListingMapper.toResponseDto(favorite.listing);
    dto.createdAt = new Date(favorite.createdAt).toISOString();
    
    return dto;
  }

  static toListResponseDto(
    favorites: Favorite[],
    total: number,
    limit: number,
    offset: number,
  ): FavoritesListResponseDto {
    const dto = new FavoritesListResponseDto();
    
    dto.favorites = favorites.map(favorite => this.toResponseDto(favorite));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
    
    return dto;
  }
}
