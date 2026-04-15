import { ApiProperty } from '@nestjs/swagger';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { BookingResponseDto } from './booking-response.dto';
import { LocationDto } from 'src/listings/dto/location.dto';
import { ListingPeriodType } from 'src/common/enums/listing-period-type.enum';

export class BookingDetailResponseDto extends BookingResponseDto {
  @ApiProperty({ type: Number, description: 'Цена за период', example: 1500 })
  listingPrice: number;
  
  @ApiProperty({ enum: CurrencyType, description: 'Валюта', example: CurrencyType.RUB })
  listingCurrency: CurrencyType;

  @ApiProperty({ enum: ListingPeriodType, description: 'Период ценообразования', example: ListingPeriodType.DAY })
  listingPricePeriod: ListingPeriodType;

  @ApiProperty({ type: Number, description: 'Размер в квадратных метрах', example: 5.5, nullable: true })
  listingSize: number | null;

  @ApiProperty({ type: String, description: 'Адрес', example: 'Москва, ул. Пушкина, д. Колотушкина' })
  listingAdress: string;

  @ApiProperty({ type: LocationDto, description: 'Координаты места', nullable: true })
  listingLocation: LocationDto | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Удобства в формате {"ключ": "значение"}',
    example: { 'security': 'true', 'electricity': '220V' },
    nullable: true,
  })
  listingAmenities: Record<string, string> | null;
}
