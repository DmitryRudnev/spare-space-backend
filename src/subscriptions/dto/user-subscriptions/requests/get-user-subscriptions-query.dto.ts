import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SubscriptionStatus } from '../../../../common/enums/subscription-status.enum';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class GetUserSubscriptionsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    description: 'Фильтр по статусу подписки (если не указан, возвращаются все)',
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
