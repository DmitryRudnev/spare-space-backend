import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsUrl,
  Min,
  Length,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';

import { ListingType } from '../../../common/enums/listing-type.enum';
import { PeriodDto } from '../../../common/dto/period.dto';
import { LocationDto } from '../location.dto';
import { PricingDto } from '../pricing.dto';
import { SpaceAmenity } from '../../../common/enums/space-amenity.enum';

export class CreateListingDto {
  @ApiProperty({
    enum: ListingType,
    description: 'Тип объявления',
    example: ListingType.PARKING,
  })
  @IsEnum(ListingType)
  type: ListingType;

  @ApiProperty({
    type: String,
    description: 'Заголовок объявления',
    minLength: 1,
    maxLength: 255,
    example: 'Просторный паркинг в центре'
  })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Описание объявления',
    example: 'Парковочное место на цокольном этаже в жилом доме с видеонаблюдением'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiProperty({ type: [PricingDto], description: 'Варианты цен для разных периодов' })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => PricingDto)
  @ValidateNested({ each: true })
  pricings: PricingDto[];

  @ApiProperty({ type: LocationDto, description: 'Координаты места' })
  @Type(() => LocationDto)
  @ValidateNested()
  location: LocationDto;

  @ApiPropertyOptional({
    type: Number,
    description: 'Размер в квадратных метрах',
    minimum: 0,
    example: 5.5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Массив URL фотографий',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  photoUrls?: string[];

  @ApiPropertyOptional({
    enum: SpaceAmenity,
    isArray: true,
    description: 'Массив удобств',
    example: [SpaceAmenity.SECURITY, SpaceAmenity.WIFI],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SpaceAmenity, { each: true })
  amenities?: SpaceAmenity[];

  @ApiProperty({
    type: [PeriodDto],
    description: 'Периоды доступности'
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => PeriodDto)
  @ValidateNested({ each: true })
  availability: PeriodDto[];
}
