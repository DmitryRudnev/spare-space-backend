import { UserSubscription } from '../../entities/user-subscription.entity';
import { UserSubscriptionResponseDto } from '../dto/user-subscriptions/responses/user-subscription-response.dto';
import { UserSubscriptionDetailResponseDto } from '../dto/user-subscriptions/responses/user-subscription-detail-response.dto';
import { UserSubscriptionListResponseDto } from '../dto/user-subscriptions/responses/user-subscription-list-response.dto';
import { SubscriptionPlanMapper } from './subscription-plan.mapper';

export class UserSubscriptionMapper {
  static toResponseDto(subscription: UserSubscription): UserSubscriptionResponseDto {
    const dto = new UserSubscriptionResponseDto();

    dto.id = subscription.id;
    dto.userId = subscription.user.id;
    dto.plan = SubscriptionPlanMapper.toResponseDto(subscription.plan);
    dto.startDate = subscription.startDate.toISOString();
    dto.endDate = subscription.endDate ? subscription.endDate.toISOString() : null;
    dto.status = subscription.status;
    dto.createdAt = subscription.createdAt.toISOString();
    dto.updatedAt = subscription.updatedAt.toISOString();

    return dto;
  }

  static toDetailResponseDto(subscription: UserSubscription): UserSubscriptionDetailResponseDto {
    const dto = new UserSubscriptionDetailResponseDto();

    dto.id = subscription.id;
    dto.userId = subscription.user.id;
    dto.plan = SubscriptionPlanMapper.toDetailResponseDto(subscription.plan);
    dto.startDate = subscription.startDate.toISOString();
    dto.endDate = subscription.endDate ? subscription.endDate.toISOString() : null;
    dto.status = subscription.status;
    dto.createdAt = subscription.createdAt.toISOString();
    dto.updatedAt = subscription.updatedAt.toISOString();

    return dto;
  }

  static toListResponseDto(
    subscriptions: UserSubscription[],
    total: number,
    limit: number,
    offset: number,
  ): UserSubscriptionListResponseDto {
    const dto = new UserSubscriptionListResponseDto();

    dto.subscriptions = subscriptions.map(sub => this.toResponseDto(sub));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
    
    return dto;
  }
}
