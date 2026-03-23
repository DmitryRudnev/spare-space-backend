import { Booking } from '../../entities/booking.entity';
import { BookingResponseDto } from '../dto/responses/booking-response.dto';
import { BookingDetailResponseDto } from '../dto/responses/booking-detail-response.dto';
import { BookingListResponseDto } from '../dto/responses/booking-list-response.dto';
import { UserMapper } from '../../users/mappers/user.mapper';
import { ListingMapper } from '../../listings/mappers/listing.mapper';

export class BookingMapper {
  static toResponseDto(booking: Booking): BookingResponseDto {
    const dto = new BookingResponseDto();
    const { startDate, endDate } = booking.periodDates;
    
    dto.id = booking.id;
    dto.listingId = booking.listing.id;
    dto.listingTitle = booking.listing.title;
    dto.firstListingPhoto = booking.listing.photoUrls?.length 
      ? booking.listing.photoUrls[0] 
      : null;
    dto.renter = UserMapper.toPublicResponseDto(booking.renter);
    dto.landlord = UserMapper.toPublicResponseDto(booking.listing.user);
    dto.totalPrice = booking.totalPrice;
    dto.currency = booking.currency;
    dto.status = booking.status;
    dto.period = {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
    dto.createdAt = booking.createdAt.toISOString();

    return dto;
  }


  static toDetailResponseDto(booking: Booking): BookingDetailResponseDto {
    const dto = new BookingDetailResponseDto();
    const { startDate, endDate } = booking.periodDates;

    dto.id = booking.id;
    dto.listing = ListingMapper.toResponseDto(booking.listing);
    dto.renter = UserMapper.toPublicResponseDto(booking.renter);
    dto.landlord = UserMapper.toPublicResponseDto(booking.listing.user);
    dto.totalPrice = booking.totalPrice;
    dto.currency = booking.currency;
    dto.status = booking.status;
    dto.period = {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
    dto.createdAt = booking.createdAt.toISOString();
    dto.updatedAt = booking.updatedAt.toISOString();

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
