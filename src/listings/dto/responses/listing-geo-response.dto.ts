import { ApiProperty } from '@nestjs/swagger';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { ListingType } from '../../../common/enums/listing-type.enum';
import { LocationDto } from '../location.dto';

export class ListingGeoResponseDto {
  @ApiProperty({ type: Number, description: 'ID объявления', example: 1 })
  id: number;

  @ApiProperty({ type: String, description: 'Заголовок объявления', example: 'Просторный паркинг в центре' })
  title: string;

  @ApiProperty({ enum: ListingType, description: 'Тип объявления', example: ListingType.PARKING })
  type: ListingType;

  @ApiProperty({ type: Number, description: 'Размер в квадратных метрах', example: 5.5, nullable: true })
  size: number | null;

  @ApiProperty({ type: Number, description: 'Цена за период', example: 1500 })
  price: number;

  @ApiProperty({ enum: CurrencyType, description: 'Валюта', example: CurrencyType.RUB })
  currency: CurrencyType;

  @ApiProperty({ enum: ListingPeriodType, description: 'Период ценообразования', example: ListingPeriodType.DAY })
  pricePeriod: ListingPeriodType;

  @ApiProperty({ type: String, description: 'URL первой фотографии', example: 'https://example.com/photo1.jpg', nullable: true })
  firstPhotoUrl: string | null;

  @ApiProperty({ type: LocationDto, description: 'Координаты места' })
  location: LocationDto;
}
