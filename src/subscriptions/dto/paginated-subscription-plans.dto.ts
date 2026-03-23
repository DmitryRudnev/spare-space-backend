import { Type } from 'class-transformer';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';

export class PaginatedSubscriptionPlansDto {
  @Type(() => SubscriptionPlan)
  plans: SubscriptionPlan[];
  total: number;
  limit: number;
  offset: number;
}
