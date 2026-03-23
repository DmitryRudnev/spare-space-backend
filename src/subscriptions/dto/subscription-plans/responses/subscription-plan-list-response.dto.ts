import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanResponseDto } from './subscription-plan-response.dto';

export class SubscriptionPlanListResponseDto {
  @ApiProperty({
    type: [SubscriptionPlanResponseDto],
    description: 'Массив тарифных планов',
  })
  plans: SubscriptionPlanResponseDto[];

  @ApiProperty({ example: 100, description: 'Общее количество планов' })
  total: number;

  @ApiProperty({ example: 10, description: 'Лимит на страницу' })
  limit: number;

  @ApiProperty({ example: 0, description: 'Смещение' })
  offset: number;
}
