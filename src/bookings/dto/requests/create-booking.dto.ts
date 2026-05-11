import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min, ValidateNested } from 'class-validator';
import { PeriodDto } from '../../../common/dto/period.dto';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';

export class CreateBookingDto {
  @ApiProperty({
    type: Number,
    description: 'ID объявления',
    example: 1,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  listingId: number;

  @ApiProperty({
    enum: ListingPeriodType,
    description: 'Выбранный тариф (период ценообразования)',
    example: ListingPeriodType.DAY
  })
  @IsEnum(ListingPeriodType)
  pricePeriod: ListingPeriodType;

  @ApiProperty({
    type: PeriodDto,
    description: 'Период бронирования'
  })
  @Type(() => PeriodDto)
  @ValidateNested()
  period: PeriodDto;

  // вместо period передавать startDate и количество pricePeriod(1-100) "periodsCount"
}
