import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { ListingPeriodType } from '../../common/enums/listing-period-type.enum';

export class PricingDto {
  @ApiProperty({ type: Number, minimum: 0, example: 1500 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: ListingPeriodType, example: ListingPeriodType.DAY })
  @IsEnum(ListingPeriodType)
  pricePeriod: ListingPeriodType;
}
