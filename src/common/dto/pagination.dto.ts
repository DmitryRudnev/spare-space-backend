import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ type: Number, description: 'Количество записей', minimum: 1, maximum: 100, example: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение', minimum: 0, example: 0 })
  @IsInt()
  @Min(0)
  offset: number;
}
