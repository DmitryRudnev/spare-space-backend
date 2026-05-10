import { ApiProperty } from '@nestjs/swagger';
import { BookingResponseDto } from './booking-response.dto';
import { LocationDto } from '../../../listings/dto/location.dto';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { SpaceAmenity } from '../../../common/enums/space-amenity.enum';

export class BookingDetailResponseDto extends BookingResponseDto {
  @ApiProperty({ type: Number, description: 'Цена за период', example: 1500 })
  listingPrice: number;

  @ApiProperty({ enum: ListingPeriodType, description: 'Период ценообразования', example: ListingPeriodType.DAY })
  listingPricePeriod: ListingPeriodType;

  @ApiProperty({ type: Number, description: 'Размер в квадратных метрах', example: 5.5, nullable: true })
  listingSize: number | null;

  @ApiProperty({ type: String, description: 'Адрес', example: 'Москва, ул. Пушкина, д. Колотушкина' })
  listingAdress: string;

  @ApiProperty({ type: LocationDto, description: 'Координаты места', nullable: true })
  listingLocation: LocationDto | null;

  @ApiProperty({
    enum: SpaceAmenity,
    isArray: true,
    description: 'Массив удобств объекта',
    example: [SpaceAmenity.SECURITY, SpaceAmenity.WIFI],
    nullable: true,
  })
  listingAmenities: SpaceAmenity[] | null;
}
