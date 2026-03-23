import { Listing } from '../../entities/listing.entity';
import { ListingResponseDto } from '../dto/responses/listing-response.dto';
import { ListingDetailResponseDto } from '../dto/responses/listing-detail-response.dto';
import { ListingListResponseDto } from '../dto/responses/listing-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';

export class ListingMapper {
  static toResponseDto(listing: Listing): ListingResponseDto {
    const dto = new ListingResponseDto();

    dto.id = listing.id;
    dto.user = UserMapper.toPublicResponseDto(listing.user);
    dto.status = listing.status;
    dto.title = listing.title;
    dto.type = listing.type;
    dto.price = listing.price;
    dto.currency = listing.currency;
    dto.pricePeriod = listing.pricePeriod;
    dto.address = listing.address;
    dto.firstPhotoUrl = listing.photoUrls && listing.photoUrls.length > 0 
      ? listing.photoUrls[0] 
      : null;
    dto.viewsCount = listing.viewsCount;
    dto.repostsCount = listing.repostsCount;
    dto.favoritesCount = listing.favoritesCount;
    dto.createdAt = listing.createdAt.toISOString();
    return dto;
  }

  static toDetailResponseDto(listing: Listing): ListingDetailResponseDto {
    const dto = new ListingDetailResponseDto();
    
    dto.id = listing.id;
    dto.user = UserMapper.toPublicResponseDto(listing.user);
    dto.status = listing.status;
    dto.title = listing.title;
    dto.type = listing.type;
    dto.size = listing.size;
    dto.description = listing.description;
    dto.price = listing.price;
    dto.currency = listing.currency;
    dto.pricePeriod = listing.pricePeriod;
    dto.address = listing.address;
    dto.photoUrls = listing.photoUrls;
    dto.amenities = listing.amenities;
    dto.viewsCount = listing.viewsCount;
    dto.repostsCount = listing.repostsCount;
    dto.favoritesCount = listing.favoritesCount;
    dto.createdAt = listing.createdAt.toISOString();
    dto.updatedAt = listing.updatedAt.toISOString();

    if (listing.location?.coordinates) {
      dto.location = {
        longitude: listing.location.coordinates[0],
        latitude: listing.location.coordinates[1]
      };
    } else {
      dto.location = null;
    }
    
    dto.availability = listing.availabilityPeriodDates.map(period => ({
      start: period.start.toISOString(),
      end: period.end.toISOString(),
    }));

    return dto;
  }

  static toListResponseDto(
    listings: Listing[], 
    total: number, 
    limit: number, 
    offset: number
  ): ListingListResponseDto {
    const dto = new ListingListResponseDto();

    dto.listings = listings.map(listing => this.toDetailResponseDto(listing));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
    return dto;
  }
}
