import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
} from 'typeorm';

import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { SubscriptionPlanStatus } from '../../common/enums/subscription-plan-status.enum';
import { CreateSubscriptionPlanDto } from '../dto/subscription-plans/requests/create-subscription-plan.dto';
import { PaginatedSubscriptionPlansDto } from '../dto/paginated-subscription-plans.dto';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class SubscriptionPlansService {
  private readonly PLANS_LIST_PREFIX = 'subscription_plans:list:active:';
  private readonly PLAN_DETAIL_PREFIX = 'subscription_plan:';
  private readonly PLANS_CACHE_TTL_SEC = 3600; // 1 час

  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    private readonly redisService: RedisService,
  ) {}

  // ==========================================================================
  // ================================= REDIS ==================================
  // ==========================================================================

  async findByIdWithCache(planId: number): Promise<SubscriptionPlan> {
    return this.redisService.getOrSet(
      `${this.PLAN_DETAIL_PREFIX}${planId}`,
      this.PLANS_CACHE_TTL_SEC,
      () => this.findById(planId),
      SubscriptionPlan
    );
  }

  async findAllWithCache(
    limit: number,
    offset: number,
    status: SubscriptionPlanStatus | undefined = SubscriptionPlanStatus.ACTIVE
  ): Promise<PaginatedSubscriptionPlansDto> {
    if (status === SubscriptionPlanStatus.ACTIVE) {
      return this.redisService.getOrSet(
        `${this.PLANS_LIST_PREFIX}limit:${limit}:offset:${offset}`,
        this.PLANS_CACHE_TTL_SEC,
        () => this.findAll(limit, offset, status),
        PaginatedSubscriptionPlansDto
      );
    }
    return this.findAll(limit, offset, status);
  }

  // ==========================================================================
  // =========================== REPOSITORY METHODS ===========================
  // ==========================================================================
  
  async findById(planId: number): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findOneBy({ id: planId });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with id ${planId} not found`);
    }
    return plan;
  }

  async findAll(
    limit: number,
    offset: number,
    status: SubscriptionPlanStatus | undefined = SubscriptionPlanStatus.ACTIVE
  ): Promise<PaginatedSubscriptionPlansDto> {
    const [plans, total] = await this.subscriptionPlanRepository.findAndCount({
      where: status ? { status } : {},
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { plans, total, limit, offset };
  }

  async existsByName(planName: string): Promise<boolean> {
    return this.subscriptionPlanRepository.existsBy({ name: planName });
  }

  async validateExistence(planId: number): Promise<void> {
    const exists = await this.subscriptionPlanRepository.existsBy({ id: planId });
    if (!exists) {
      throw new NotFoundException(`Subscription plan with id ${planId} not found`);
    }
  }

  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const alreadyExists = await this.existsByName(dto.name);
    if (alreadyExists) {
      throw new ConflictException(`Subscription plan with name ${dto.name} already exists`);
    }
    const plan = this.subscriptionPlanRepository.create(dto);
    const savedPlan = await this.subscriptionPlanRepository.save(plan);

    await this.redisService.deleteByPattern(`${this.PLANS_LIST_PREFIX}*`);
    return savedPlan;
  }

  async update(
    planId: number,
    data: Partial<SubscriptionPlan>,
  ): Promise<SubscriptionPlan> {
    const plan = await this.findByIdWithCache(planId);
    Object.assign(plan, data);
    const updatedPlan = await this.subscriptionPlanRepository.save(plan);

    await this.redisService.delete(`${this.PLAN_DETAIL_PREFIX}${planId}`);
    await this.redisService.deleteByPattern(`${this.PLANS_LIST_PREFIX}*`);
    return updatedPlan;
  }
}
