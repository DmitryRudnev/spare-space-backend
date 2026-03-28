import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class PeriodDto {
  @ApiProperty({ 
    type: String, 
    description: 'Дата начала (ISO8601)', 
    example: '2026-01-01T00:00:00.000Z' 
  })
  @Type(() => Date)
  @IsDate()
  start: Date;

  @ApiProperty({ 
    type: String, 
    description: 'Дата окончания (ISO8601)', 
    example: '2026-02-15T00:00:00.000Z' 
  })
  @Type(() => Date)
  @IsDate()
  end: Date;
}
