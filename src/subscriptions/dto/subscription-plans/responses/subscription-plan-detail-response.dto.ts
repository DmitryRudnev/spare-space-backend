import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlanResponseDto } from './subscription-plan-response.dto';

export class SubscriptionPlanDetailResponseDto extends SubscriptionPlanResponseDto {
  @ApiPropertyOptional({
    example: 'Расширенный тариф с поддержкой',
    description: 'Описание плана',
    nullable: true,
  })
  description: string | null;

  @ApiPropertyOptional({
    example: { support: '24/7', bonus: '1000 coins' },
    description: 'Дополнительные возможности',
    nullable: true,
    type: Object,
  })
  extraFeatures: Record<string, string> | null;
}
