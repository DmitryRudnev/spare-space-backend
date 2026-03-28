import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { ListingType } from '../../../common/enums/listing-type.enum';
import { ListingStatus } from '../../../common/enums/listing-status.enum';
import { PeriodDto } from '../../../common/dto/period.dto';
import { LocationDto } from '../location.dto';

export class ListingDetailResponseDto {
    @ApiProperty({ 
    type: Number, 
    description: 'ID объявления', 
    example: 1 
  })
  id: number;

  @ApiProperty({ 
    type: UserPublicResponseDto, 
    description: 'Пользователь, создавший объявление' 
  })
  user: UserPublicResponseDto;

  @ApiProperty({
    enum: ListingStatus,
    description: 'Статус объявления',
    example: ListingStatus.ACTIVE
  })
  status: ListingStatus;

  @ApiProperty({
    type: String,
    description: 'Заголовок объявления',
    example: 'Просторный паркинг в центре'
  })
  title: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Описание объявления',
    example: 'Парковочное место на цокольном этаже'
  })
  description: string | null;

  @ApiProperty({ 
    enum: ListingType, 
    description: 'Тип объявления', 
    example: ListingType.PARKING 
  })
  type: ListingType;

  @ApiPropertyOptional({ 
    type: Number, 
    description: 'Размер в квадратных метрах', 
    example: 5.5 
  })
  size: number | null;

  @ApiProperty({ 
    type: Number, 
    description: 'Цена за период', 
    example: 1500 
  })
  price: number;

  @ApiProperty({ 
    enum: CurrencyType, 
    description: 'Валюта', 
    example: CurrencyType.RUB 
  })
  currency: CurrencyType;

  @ApiProperty({
    enum: ListingPeriodType,
    description: 'Период ценообразования',
    example: ListingPeriodType.DAY
  })
  pricePeriod: ListingPeriodType;

  @ApiProperty({
    type: String,
    description: 'Адрес',
    example: 'Москва, ул. Пушкина, д. Колотушкина'
  })
  address: string;

  @ApiPropertyOptional({ 
    type: LocationDto, 
    description: 'Координаты места' 
  })
  location: LocationDto | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Массив URL фотографий',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
  })
  photoUrls: string[] | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Удобства в формате {"ключ": "значение"}',
    example: { security: 'true', electricity: '220V' }
  })
  amenities: Record<string, string> | null;

  @ApiProperty({ 
    type: [PeriodDto], 
    description: 'Периоды доступности' 
  })
  availability: PeriodDto[];

  @ApiProperty({ 
    type: Number, 
    description: 'Количество просмотров', 
    example: 100 
  })
  viewsCount: number;

  @ApiProperty({ 
    type: Number, 
    description: 'Количество репостов', 
    example: 10 
  })
  repostsCount: number;

  @ApiProperty({ 
    type: Number, 
    description: 'Количество добавлений в избранное', 
    example: 5 
  })
  favoritesCount: number;

  @ApiProperty({
    type: String,
    description: 'Дата создания объявления (ISO8601)',
    example: '2025-01-01T00:00:00.000Z'
  })
  createdAt: string;

  @ApiProperty({
    type: String,
    description: 'Дата обновления объявления (ISO8601)',
    example: '2025-01-02T00:00:00.000Z'
  })
  updatedAt: string;
}
