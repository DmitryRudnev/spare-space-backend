import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { SubscriptionPlanResponseDto } from '../dto/subscription-plans/responses/subscription-plan-response.dto';
import { SubscriptionPlanDetailResponseDto } from '../dto/subscription-plans/responses/subscription-plan-detail-response.dto';
import { SubscriptionPlanListResponseDto } from '../dto/subscription-plans/responses/subscription-plan-list-response.dto';

export class SubscriptionPlanMapper {
  static toResponseDto(plan: SubscriptionPlan): SubscriptionPlanResponseDto {
    const dto = new SubscriptionPlanResponseDto();

    dto.id = plan.id;
    dto.name = plan.name;
    dto.status = plan.status;
    dto.price = plan.price;
    dto.currency = plan.currency;
    dto.maxListings = plan.maxListings;
    dto.prioritySearch = plan.prioritySearch;
    dto.boostsPerMonth = plan.boostsPerMonth;
    dto.createdAt = plan.createdAt.toISOString();
    dto.updatedAt = plan.updatedAt.toISOString();

    return dto;
  }

  static toDetailResponseDto(plan: SubscriptionPlan): SubscriptionPlanDetailResponseDto {
    const dto = new SubscriptionPlanDetailResponseDto();
    const baseDto = this.toResponseDto(plan);
    Object.assign(dto, baseDto);

    dto.description = plan.description;
    dto.extraFeatures = plan.extraFeatures;
    
    return dto;
  }

  static toListResponseDto(
    plans: SubscriptionPlan[],
    total: number,
    limit: number,
    offset: number,
  ): SubscriptionPlanListResponseDto {
    const dto = new SubscriptionPlanListResponseDto();

    dto.plans = plans.map(plan => this.toResponseDto(plan));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;
    
    return dto;
  }
}
