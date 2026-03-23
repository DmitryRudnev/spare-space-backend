import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { UserSubscriptionsService } from './services/user-subscriptions.service';
import { SubscriptionPlansService } from './services/subscription-plans.service';
import { UserSubscriptionsController } from './controllers/user-subscriptions.controller';
import { SubscriptionPlansController } from './controllers/subscription-plans.controller';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription]),
    UsersModule,
    WalletsModule,
    RedisModule,
  ],
  controllers: [UserSubscriptionsController, SubscriptionPlansController],
  providers: [UserSubscriptionsService, SubscriptionPlansService],
  exports: [UserSubscriptionsService, SubscriptionPlansService],
})
export class SubscriptionsModule {}
