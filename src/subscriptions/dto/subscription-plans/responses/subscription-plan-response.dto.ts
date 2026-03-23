import { ApiProperty } from '@nestjs/swagger';
import { CurrencyType } from '../../../../common/enums/currency-type.enum';
import { SubscriptionPlanStatus } from '../../../../common/enums/subscription-plan-status.enum';

export class SubscriptionPlanResponseDto {
  @ApiProperty({ example: 1, description: 'ID тарифного плана' })
  id: number;

  @ApiProperty({ example: 'Premium', description: 'Название плана' })
  name: string;

  @ApiProperty({
    enum: SubscriptionPlanStatus,
    example: SubscriptionPlanStatus.ACTIVE,
    description: 'Статус плана',
  })
  status: SubscriptionPlanStatus;

  @ApiProperty({ example: 999.99, description: 'Цена' })
  price: number;

  @ApiProperty({
    enum: CurrencyType,
    example: CurrencyType.RUB,
    description: 'Валюта',
  })
  currency: CurrencyType;

  @ApiProperty({ example: 50, description: 'Максимальное количество объявлений' })
  maxListings: number;

  @ApiProperty({ example: true, description: 'Приоритет в поиске' })
  prioritySearch: boolean;

  @ApiProperty({ example: 10, description: 'Количество бустов в месяц' })
  boostsPerMonth: number;

  @ApiProperty({
    example: '2025-01-01T12:00:00.000Z',
    description: 'Дата создания',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-01-01T12:00:00.000Z',
    description: 'Дата последнего обновления',
  })
  updatedAt: string;
}
