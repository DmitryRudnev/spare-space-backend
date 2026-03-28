import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { PeriodDto } from '../../../common/dto/period.dto';

export class UpdateBookingPeriodDto {
  @ApiProperty({
    type: PeriodDto,
    description: 'Новый период бронирования'
  })
  @Type(() => PeriodDto)
  @ValidateNested()
  period: PeriodDto;
}
