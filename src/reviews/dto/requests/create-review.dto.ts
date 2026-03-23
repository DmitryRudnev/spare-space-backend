import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 1,
    description: 'ID бронирования, к которому относится отзыв',
  })
  @IsInt()
  @Min(1)
  bookingId: number;

  @ApiProperty({
    example: 5,
    description: 'Оценка от 1 до 5',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    example: 'Всё прошло отлично, хозяин приветливый',
    description: 'Текст отзыва (необязательно)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;
}