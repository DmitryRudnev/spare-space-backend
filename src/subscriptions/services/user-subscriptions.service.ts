import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
} from 'typeorm';

import { UsersService } from '../../users/services/users.service';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { UserRoleType } from '../../common/enums/user-role-type.enum';
import { SubscriptionPlansService } from './subscription-plans.service';

@Injectable()
export class UserSubscriptionsService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly usersService: UsersService,
  ) {}

  // ==========================================================================
  // ========================== CONTROLLER HANDLERS ===========================
  // ==========================================================================

  async handleFindById(userId: number, subscriptionId: number): Promise<UserSubscription> {
    const subscription = await this.findById(subscriptionId);
    if (Number(subscription.user.id) !== userId) {
      throw new UnauthorizedException(`Not authorized to see this subscription`);
    }
    return subscription;
  }

  async handleCancel(userId: number, subscriptionId: number): Promise<UserSubscription> {
    const subscription = await this.handleFindById(userId, subscriptionId);
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(`Can cancel only active subscriptions`);
    }
    return this.updateStatus(subscriptionId, SubscriptionStatus.CANCELLED);
  }

  // ==========================================================================
  // =========================== REPOSITORY METHODS ===========================
  // ==========================================================================

  async findById(subscriptionId: number): Promise<UserSubscription> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: {
        user: true,
        plan: true },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }
    return subscription;
  }

  async findActiveByUser(userId: number): Promise<UserSubscription | null> {
    return this.userSubscriptionRepository.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatus.ACTIVE,
      },
      relations: {
        user: true,
        plan: true,
      },
    });
  }

  async findByUser(
    userId: number,
    limit: number,
    offset: number,
    status: SubscriptionStatus | undefined = SubscriptionStatus.ACTIVE,
  ): Promise<{ subscriptions: UserSubscription[], total: number, limit: number, offset: number }> {
    const where: FindOptionsWhere<UserSubscription> = { user: { id: userId } };
    if (status !== undefined) {
      where.status = status;
    }
    const [subscriptions, total] = await this.userSubscriptionRepository.findAndCount({
      where,
      relations: { plan: true },
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { subscriptions, total, limit, offset };
  }

  async create(
    userId: number,
    planId: number,
    startDate: Date,
    monthsCount: number | null,
  ): Promise<UserSubscription> {
    await this.subscriptionPlansService.validateExistence(planId);

    const hasLandlordRole = await this.usersService.hasRole(userId, UserRoleType.LANDLORD);
    if (!hasLandlordRole) {
      throw new UnauthorizedException('Only landlords can purchase subscriptions');
    }
    
    const alreadyExists = await this.userSubscriptionRepository.existsBy({
      user: { id: userId },
      plan: { id: planId },
      status: SubscriptionStatus.ACTIVE
    });
    if (alreadyExists) {
      throw new ConflictException(`User ${userId} already has active subscription for plan ${planId}`);
    }

    let endDate: Date | null = null;
    if (monthsCount !== null) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsCount);
    }
    const subscription = this.userSubscriptionRepository.create({
      user: { id: userId },
      plan: { id: planId },
      startDate,
      endDate,
    });
    await this.userSubscriptionRepository.save(subscription);
    return this.findById(subscription.id);
  }

  async updateStatus(
    subscriptionId: number,
    newStatus: SubscriptionStatus,
  ): Promise<UserSubscription> {
    const subscription = await this.findById(subscriptionId);
    subscription.status = newStatus;
    await this.userSubscriptionRepository.save(subscription);
    return this.findById(subscriptionId);
  }
}
