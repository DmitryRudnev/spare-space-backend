import { Booking } from '../../entities/booking.entity';
import { BookingResponseDto } from '../dto/responses/booking-response.dto';
import { BookingDetailResponseDto } from '../dto/responses/booking-detail-response.dto';
import { BookingListResponseDto } from '../dto/responses/booking-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';

export class BookingMapper {
  static toResponseDto(booking: Booking): BookingResponseDto {
    const dto = new BookingResponseDto();
    
    dto.id = booking.id;
    dto.listingId = booking.listing.id;
    dto.listingType = booking.listing.type;
    dto.listingTitle = booking.listing.title;
    dto.listingFirstPhotoUrl = booking.listing.photoUrls?.[0] ?? null;
    dto.renter = UserMapper.toPublicResponseDto(booking.renter);
    dto.landlord = UserMapper.toPublicResponseDto(booking.listing.user);
    dto.totalPrice = booking.totalPrice;
    dto.status = booking.status;
    dto.period = booking.periodDates;
    dto.createdAt = booking.createdAt.toISOString();
    dto.updatedAt = booking.updatedAt.toISOString();

    return dto;
  }

  static toDetailResponseDto(booking: Booking): BookingDetailResponseDto {
    const baseDto = this.toResponseDto(booking);
    const dto = new BookingDetailResponseDto();
    Object.assign(dto, baseDto);

    dto.listingPrice = booking.listing.price;
    dto.listingPricePeriod = booking.listing.pricePeriod
    dto.listingSize = booking.listing.size;
    dto.listingAdress = booking.listing.address;
    dto.listingAmenities = booking.listing.amenities;
    dto.listingLocation = booking.listing.location?.coordinates
      ? { longitude: booking.listing.location.coordinates[0],
          latitude:  booking.listing.location.coordinates[1] }
      : null;

    return dto;
  }

  static toListResponseDto(
    bookings: Booking[], 
    total: number, 
    limit: number, 
    offset: number
  ): BookingListResponseDto {
    const dto = new BookingListResponseDto();
    
    dto.bookings = bookings.map(booking => this.toResponseDto(booking));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
}

