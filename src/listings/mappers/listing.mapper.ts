import { Listing } from '../../entities/listing.entity';
import { ListingResponseDto } from '../dto/responses/listing-response.dto';
import { ListingDetailResponseDto } from '../dto/responses/listing-detail-response.dto';
import { ListingListResponseDto } from '../dto/responses/listing-list-response.dto';
import { ListingGeoResponseDto } from '../dto/responses/listing-geo-response.dto';
import { ListingGeoListResponseDto } from '../dto/responses/listing-geo-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';
import { ListingBaseResponseDto } from '../dto/responses/listing-base-response.dto';

export class ListingMapper {
  private static toBaseResponseDto(listing: Listing): ListingBaseResponseDto {
    const dto = new ListingBaseResponseDto();

    dto.id = listing.id;
    dto.user = UserMapper.toPublicResponseDto(listing.user);
    dto.status = listing.status;
    dto.title = listing.title;
    dto.type = listing.type;
    dto.size = listing.size;
    dto.price = listing.formattedPrice;
    dto.currency = listing.currency;
    dto.pricePeriod = listing.pricePeriod;
    dto.address = listing.address;
    dto.viewsCount = listing.viewsCount;
    dto.repostsCount = listing.repostsCount;
    dto.favoritesCount = listing.favoritesCount;
    dto.createdAt = listing.createdAt.toISOString();

    return dto;
  }

  static toResponseDto(listing: Listing): ListingResponseDto {
    const baseDto = this.toBaseResponseDto(listing);
    const dto = new ListingResponseDto();
    Object.assign(dto, baseDto);

    dto.firstPhotoUrl = listing.photoUrls?.[0] || null;

    return dto;
  }

  static toGeoResponseDto(listing: Listing): ListingGeoResponseDto {
    const dto = new ListingGeoResponseDto();

    dto.id = listing.id;
    dto.title = listing.title;
    dto.type = listing.type;
    dto.size = listing.size;
    dto.price = listing.formattedPrice;
    dto.currency = listing.currency;
    dto.pricePeriod = listing.pricePeriod;
    dto.firstPhotoUrl = listing.photoUrls?.[0] || null;

    if (!listing.location) {
      throw new Error(`listing.location supposed to be defined, but it's not`);
    }
    dto.location = {
      longitude: listing.location.coordinates[0],
      latitude: listing.location.coordinates[1]
    }

    return dto;
  }

  static toDetailResponseDto(listing: Listing, isFavorite?: boolean): ListingDetailResponseDto {
    const baseDto = this.toBaseResponseDto(listing);
    const dto = new ListingDetailResponseDto();
    Object.assign(dto, baseDto);
    
    dto.description = listing.description;
    dto.photoUrls = listing.photoUrls;
    dto.amenities = listing.amenities;
    dto.availability = listing.availabilityPeriodDates;
    dto.isFavorite = isFavorite ?? null;
    dto.location = listing.location?.coordinates
      ? { longitude: listing.location.coordinates[0],
          latitude:  listing.location.coordinates[1] }
      : null;

    return dto;
  }

  static toListResponseDto(
    listings: Listing[], 
    total: number, 
    limit: number, 
    offset: number
  ): ListingListResponseDto {
    const dto = new ListingListResponseDto();

    dto.listings = listings.map(listing => this.toResponseDto(listing));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }

  static toGeoListResponseDto(
    listings: any[],
    total: number,
    limit: number,
    offset: number,
  ): ListingGeoListResponseDto {
    const dto = new ListingGeoListResponseDto();

    dto.listings = listings.map(listing => this.toGeoResponseDto(listing));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
}
