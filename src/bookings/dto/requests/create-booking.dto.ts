import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, ValidateNested } from 'class-validator';
import { PeriodDto } from '../../../common/dto/period.dto';

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
    type: PeriodDto,
    description: 'Период бронирования'
  })
  @Type(() => PeriodDto)
  @ValidateNested()
  period: PeriodDto;
}
