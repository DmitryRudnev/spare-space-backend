import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanDetailResponseDto } from '../../subscription-plans/responses/subscription-plan-detail-response.dto';
import { SubscriptionStatus } from '../../../../common/enums/subscription-status.enum';

export class UserSubscriptionDetailResponseDto {
  @ApiProperty({ example: 1, description: 'ID подписки' })
  id: number;

  @ApiProperty({ example: 42, description: 'ID пользователя' })
  userId: number;

  @ApiProperty({ type: SubscriptionPlanDetailResponseDto, description: 'Детальная информация о тарифном плане' })
  plan: SubscriptionPlanDetailResponseDto;

  @ApiProperty({ example: '2025-04-01T00:00:00.000Z', description: 'Дата начала' })
  startDate: string;

  @ApiProperty({ example: '2025-05-01T00:00:00.000Z', nullable: true, description: 'Дата окончания (null = бессрочно)' })
  endDate: string | null;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE, description: 'Статус подписки' })
  status: SubscriptionStatus;

  @ApiProperty({ example: '2025-04-01T12:00:00.000Z', description: 'Дата создания' })
  createdAt: string;

  @ApiProperty({ example: '2025-04-01T12:00:00.000Z', description: 'Дата обновления' })
  updatedAt: string;
}
