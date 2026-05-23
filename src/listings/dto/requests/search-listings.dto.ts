import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
  IsObject,
  ValidateNested,
  IsNotEmpty,
  IsArray
} from 'class-validator';

import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { ListingType } from '../../../common/enums/listing-type.enum';
import { ListingStatus } from '../../../common/enums/listing-status.enum';
import { SpaceAmenity } from '../../../common/enums/space-amenity.enum';

export class SearchListingsDto {
  @ApiPropertyOptional({
    enum: ListingStatus,
    description: 'Статус объявления; доступно только для эндпоинта GET listings/my',
    example: ListingStatus.PENDING_APPROVAL
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({
    type: String,
    description: 'Поиск по названию',
    example: 'Уютный гараж'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;
  
  @ApiPropertyOptional({
    enum: ListingType,
    description: 'Тип объявления',
    example: ListingType.PARKING
  })
  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Минимальная цена',
    example: 1000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Максимальная цена',
    example: 5000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: ListingPeriodType,
    description: 'Период ценообразования',
    example: ListingPeriodType.DAY
  })
  @IsOptional()
  @IsEnum(ListingPeriodType)
  pricePeriod?: ListingPeriodType;

  @ApiPropertyOptional({
    type: Number,
    minimum: -180,
    maximum: 180,
    description: 'Долгота',
    example: 37.2106
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: -90,
    maximum: 90,
    description: 'Широта',
    example: 55.9833
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Радиус поиска в метрах',
    example: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number;

  @ApiPropertyOptional({
    enum: SpaceAmenity,
    isArray: true,
    description: 'Массив удобств (можно передавать как JSON-строку, через запятую, либо повторяя параметр)',
    example: [SpaceAmenity.SECURITY, SpaceAmenity.WIFI],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      // Если клиент передал массив в виде JSON-строки '["SECURITY"]'
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      // Если передано через запятую: 'SECURITY,WIFI'
      return value.split(',').map((item) => item.trim());
    }
    // Если передано как ?amenities=SECURITY&amenities=WIFI
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsEnum(SpaceAmenity, { each: true })
  amenities?: SpaceAmenity[];

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'Лимит записей',
    example: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Смещение',
    example: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset: number = 0;
}
