import type { Point } from 'geojson';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CurrencyType } from '../common/enums/currency-type.enum';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingType } from '../common/enums/listing-type.enum';

import { User } from './user.entity';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ListingType, enumName: 'listing_type' })
  type: ListingType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  price: number;

  @Column({
    type: 'enum',
    enum: ListingPeriodType,
    enumName: 'listing_period_type',
    default: ListingPeriodType.DAY,
  })
  pricePeriod: ListingPeriodType;

  @Column({
    type: 'enum',
    enum: CurrencyType,
    enumName: 'currency_type',
    default: CurrencyType.RUB,
  })
  currency: CurrencyType;

  @Column({ type: 'geometry', srid: 4326, nullable: true })
  location: Point | null;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  size: number | null;

  @Column({ type: 'jsonb', nullable: true })
  photoUrls: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  amenities: Record<string, string> | null;

  @Column({ type: 'tstzrange', array: true })
  availability: string[];

  @Column({
    type: 'enum',
    enum: ListingStatus,
    enumName: 'listing_status',
    default: ListingStatus.DRAFT,
  })
  status: ListingStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number | null;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  repostsCount: number;

  @Column({ default: 0 })
  favoritesCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  get availabilityPeriodDates(): { startDate: Date; endDate: Date }[] {
    return this.availability.map((periodString) => {
      if (!/^\[[^,]+,[^,]+\)$/.test(periodString.trim())) {
        throw new Error(`Invalid listing availability period stored in database: ${periodString.trim()}`);
      }
      const cleanStr = periodString.replace(/[\[\)]/g, '');
      const parts = cleanStr.split(',').map(date => date.trim());
      return {
        startDate: new Date(parts[0]),
        endDate: new Date(parts[1]),
      };
    });
  }

  isAvailablePeriod(periodStart: Date, periodEnd: Date): boolean {
    const start = periodStart.getTime();
    const end = periodEnd.getTime();
    
    return this.availabilityPeriodDates.some(({ startDate, endDate }) => {
      return startDate.getTime() <= start && end < endDate.getTime();
    });
  }
}
