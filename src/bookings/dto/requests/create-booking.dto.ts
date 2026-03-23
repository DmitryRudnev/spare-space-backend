import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsDate, ValidateNested } from 'class-validator';

export class BookingPeriodDto {
  @ApiProperty({
    type: String,
    description: 'Дата начала бронирования (ISO8601)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @Type(() => Date)
  @IsDate()
  start: Date;

  @ApiProperty({
    type: String,
    description: 'Дата окончания бронирования (ISO8601)',
    example: '2025-02-01T00:00:00.000Z'
  })
  @Type(() => Date)
  @IsDate()
  end: Date;
}

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
    type: BookingPeriodDto,
    description: 'Период бронирования'
  })
  @Type(() => BookingPeriodDto)
  @ValidateNested({ each: true })
  period: BookingPeriodDto;
}
