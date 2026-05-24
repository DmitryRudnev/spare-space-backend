import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, Max, Min } from 'class-validator';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';

export class UpdateBookingPeriodDto {
  @ApiProperty({ enum: ListingPeriodType, description: 'Выбранный тариф', example: ListingPeriodType.DAY })
  @IsEnum(ListingPeriodType)
  pricePeriod: ListingPeriodType;
  
  @ApiProperty({ type: Date, description: 'Новая дата и время начала бронирования', example: '2026-06-01T12:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ type: Number, description: 'Новое количество периодов (1-100)', example: 1, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  periodsCount: number;
}
