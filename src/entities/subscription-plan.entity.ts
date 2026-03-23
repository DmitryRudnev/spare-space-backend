import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Type } from 'class-transformer';
import { CurrencyType } from '../common/enums/currency-type.enum';
import { SubscriptionPlanStatus } from '../common/enums/subscription-plan-status.enum';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlanStatus,
    default: SubscriptionPlanStatus.ACTIVE,
  })
  status: SubscriptionPlanStatus;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  price: number;

  @Column({
    type: 'enum',
    enum: CurrencyType,
    default: CurrencyType.RUB,
  })
  currency: CurrencyType;

  @Column()
  maxListings: number;

  @Column()
  prioritySearch: boolean;

  @Column()
  boostsPerMonth: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  extraFeatures: Record<string, string> | null;

  @Type(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Type(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
