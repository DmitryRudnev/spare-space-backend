import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn  } from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listing.entity';
import { CurrencyType } from '../common/enums/currency-type.enum';
import { BookingStatus } from '../common/enums/booking-status.enum';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'renter_id' })
  renter: User;

  @Column({ type: 'tstzrange' })
  period: string;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  totalPrice: number;

  @Column({ type: 'enum', enum: CurrencyType, enumName: 'currency_type', default: CurrencyType.RUB })
  currency: CurrencyType;

  @Column({ type: 'enum', enum: BookingStatus, enumName: 'booking_status', default: BookingStatus.PENDING })
  status: BookingStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  get periodDates(): { startDate: Date; endDate: Date } {
    if (!/^\[[^,]+,[^,]+\)$/.test(this.period.trim())) {
      throw new Error(`Invalid booking period stored in database: ${this.period.trim()}`);
    }
    const cleanStr = this.period.replace(/[\[\)]/g, '');
    const parts = cleanStr.split(',').map(date => date.trim());
    return {
      startDate: new Date(parts[0]),
      endDate: new Date(parts[1]),
    };
  }

  get startDate(): Date {
    return this.periodDates.startDate;
  }

  get endDate(): Date {
    return this.periodDates.endDate;
  }
}
