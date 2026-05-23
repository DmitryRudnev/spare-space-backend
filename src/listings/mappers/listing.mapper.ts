import { Listing } from '../../entities/listing.entity';
import { ListingResponseDto } from '../dto/responses/listing-response.dto';
import { ListingDetailResponseDto } from '../dto/responses/listing-detail-response.dto';
import { ListingListResponseDto } from '../dto/responses/listing-list-response.dto';
import { ListingGeoResponseDto } from '../dto/responses/listing-geo-response.dto';
import { ListingGeoListResponseDto } from '../dto/responses/listing-geo-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';
import { ListingBaseResponseDto } from '../dto/responses/listing-base-response.dto';
import { ListingPeriodType } from '../../common/enums/listing-period-type.enum';

export class ListingMapper {
  private static getDisplayPricing(listing: Listing, requestedPricePeriod?: ListingPeriodType) {
    if (!listing.pricings || listing.pricings.length === 0) {
      return { price: 0, pricePeriod: ListingPeriodType.DAY };
    }
    
    if (requestedPricePeriod) {
      const requestedPricing = listing.pricings.find(p => p.pricePeriod === requestedPricePeriod);
      if (requestedPricing) return requestedPricing;
    }

    const weights: Record<ListingPeriodType, number> = {
      [ListingPeriodType.HOUR]: 1,
      [ListingPeriodType.DAY]: 2,
      [ListingPeriodType.WEEK]: 3,
      [ListingPeriodType.MONTH]: 4,
    };

    return listing.pricings.reduce((min, curr) => 
      weights[curr.pricePeriod] < weights[min.pricePeriod] ? curr : min
    );
  }

  private static toBaseResponseDto(listing: Listing, requestedPricePeriod?: ListingPeriodType): ListingBaseResponseDto {
    const dto = new ListingBaseResponseDto();
    const displayPricing = this.getDisplayPricing(listing, requestedPricePeriod);

    dto.id = listing.id;
    dto.user = UserMapper.toPublicResponseDto(listing.user);
    dto.status = listing.status;
    dto.title = listing.title;
    dto.type = listing.type;
    dto.size = listing.size;
    dto.price = Number(displayPricing.price);
    dto.pricePeriod = displayPricing.pricePeriod;
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
    const displayPricing = this.getDisplayPricing(listing, requestedPricePeriod);

    dto.id = listing.id;
    dto.title = listing.title;
    dto.type = listing.type;
    dto.size = listing.size;
    dto.price = Number(displayPricing.price);
    dto.pricePeriod = displayPricing.pricePeriod;
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
    dto.pricings = listing.pricings.map(p => ({
      price: Number(p.price),
      pricePeriod: p.pricePeriod
    }));


    return dto;
  }

  static toListResponseDto(
    listings: Listing[], 
    total: number, 
    limit: number, 
    offset: number,
    requestedPricePeriod?: ListingPeriodType,
  ): ListingListResponseDto {
    const dto = new ListingListResponseDto();

    dto.listings = listings.map(listing => this.toResponseDto(listing, requestedPricePeriod));
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
    requestedPricePeriod?: ListingPeriodType,
  ): ListingGeoListResponseDto {
    const dto = new ListingGeoListResponseDto();

    dto.listings = listings.map(listing => this.toGeoResponseDto(listing, requestedPricePeriod));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
}
