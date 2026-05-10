import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    example: 'Premium',
    description: 'Название тарифного плана (уникальное)',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 999.99,
    description: 'Цена',
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 16 })
  @Min(0)
  price: number;

  @ApiProperty({
    example: 50,
    description: 'Максимальное количество активных объявлений',
  })
  @IsNumber()
  @Min(1)
  maxListings: number;

  @ApiProperty({
    example: true,
    description: 'Приоритет в поиске',
  })
  @IsBoolean()
  prioritySearch: boolean;

  @ApiProperty({
    example: 10,
    description: 'Количество бустов в месяц',
  })
  @IsNumber()
  @Min(0)
  boostsPerMonth: number;

  @ApiPropertyOptional({
    example: 'Расширенный тариф с поддержкой',
    description: 'Описание плана',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: { 'support': '24/7', 'bonus': '1000 coins' },
    description: 'Дополнительные возможности (JSON)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  extraFeatures?: Record<string, string>;
}
