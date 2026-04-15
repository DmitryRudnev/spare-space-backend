import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanResponseDto } from './subscription-plan-response.dto';

export class SubscriptionPlanDetailResponseDto extends SubscriptionPlanResponseDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Описание плана',
    example: 'Расширенный тариф с поддержкой',
  })
  description: string | null;

  @ApiProperty({
    type: Object,
    nullable: true,
    description: 'Дополнительные возможности',
    example: { 'support': '24/7', 'bonus': '1000 coins' },
  })
  extraFeatures: Record<string, string> | null;
}
