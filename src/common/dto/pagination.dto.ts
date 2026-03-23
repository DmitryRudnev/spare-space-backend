import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ example: 10, description: 'Количество записей', minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @ApiProperty({ example: 0, description: 'Смещение', minimum: 0 })
  @IsInt()
  @Min(0)
  offset: number;
}
