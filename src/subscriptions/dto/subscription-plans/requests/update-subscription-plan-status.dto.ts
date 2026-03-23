import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubscriptionPlanStatus } from '../../../../common/enums/subscription-plan-status.enum';

export class UpdateSubscriptionPlanStatusDto {
  @ApiProperty({
    enum: SubscriptionPlanStatus,
    example: SubscriptionPlanStatus.ACTIVE,
    description: 'Новый статус плана',
  })
  @IsEnum(SubscriptionPlanStatus)
  status: SubscriptionPlanStatus;
}
