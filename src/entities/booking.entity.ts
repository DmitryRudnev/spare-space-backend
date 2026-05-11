import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn  } from 'typeorm';
import { Type } from 'class-transformer';
import { User } from './user.entity';
import { Listing } from './listing.entity';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Type(() => Listing)
  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ListingPeriodType, enumName: 'listing_period_type' })
  pricePeriod: ListingPeriodType;

  @Type(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'renter_id' })
  renter: User;

  @Column({ type: 'tstzrange' })
  period: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'enum', enum: BookingStatus, enumName: 'booking_status', default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  completionJobId: string | null;

  @Type(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Type(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  get periodDates(): { start: Date; end: Date } {
    const trimmed = this.period.trim();
    if (!/^\[[^,]+,[^,]+\)$/.test(trimmed)) {
      throw new Error(`Invalid booking period stored in database: ${trimmed}`);
    }
    const parts = trimmed.slice(1, -1).split(',').map(s => s.trim());
    if (parts.length !== 2) {
      throw new Error(`Invalid booking period stored in database: ${trimmed}`);
    }
    return {
      start: new Date(parts[0]),
      end: new Date(parts[1]),
    };
  }
}
