import { ApiProperty } from '@nestjs/swagger';
import { PeriodDto } from '../../../common/dto/period.dto';
import { LocationDto } from '../location.dto';
import { PricingDto } from '../pricing.dto';
import { ListingBaseResponseDto } from './listing-base-response.dto';
import { SpaceAmenity } from '../../../common/enums/space-amenity.enum';

export class ListingDetailResponseDto extends ListingBaseResponseDto {
  @ApiProperty({ type: String, description: 'Описание объявления', example: 'Парковочное место на цокольном этаже', nullable: true })
  description: string | null;

  @ApiProperty({ type: [PricingDto], description: 'Все доступные тарифы' })
  pricings: PricingDto[];

  @ApiProperty({ type: LocationDto, description: 'Координаты места', nullable: true })
  location: LocationDto | null;

  @ApiProperty({ type: [String], description: 'Массив URL фотографий', example: ['https://example.com/photo1.jpg'], nullable: true })
  photoUrls: string[] | null;

  @ApiProperty({
    enum: SpaceAmenity,
    isArray: true,
    description: 'Массив удобств',
    example: [SpaceAmenity.SECURITY, SpaceAmenity.WIFI],
    nullable: true,
  })
  amenities: SpaceAmenity[] | null;

  @ApiProperty({ type: [PeriodDto], description: 'Периоды доступности' })
  availability: PeriodDto[];

  @ApiProperty({
    type: Boolean,
    description: 'Находится ли объявление в избранном у текущего пользователя',
    example: true,
    nullable: true,
  })
  isFavorite: boolean | null;
}
