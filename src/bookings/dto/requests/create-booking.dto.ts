import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, Max, Min } from 'class-validator';
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

  @ApiProperty({ type: Date, description: 'Дата и время начала бронирования', example: '2026-06-01T12:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ type: Number, description: 'Количество периодов (1-100)', example: 1, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  periodsCount: number;
}
