import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetAvailabilityDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'ID бронирования для исключения из расчета свободных слотов',
    example: 100,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  excludeBookingId?: number;
}
