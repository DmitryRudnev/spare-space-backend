import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ example: 10, description: 'Количество записей', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ example: 0, description: 'Смещение', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
