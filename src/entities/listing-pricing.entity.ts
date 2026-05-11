import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Type } from 'class-transformer';
import { Listing } from './listing.entity';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';

@Entity('listing_pricings')
@Unique(['listing', 'pricePeriod'])
export class ListingPricing {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Type(() => Listing)
  @ManyToOne(() => Listing, listing => listing.pricings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ListingPeriodType, enumName: 'listing_period_type' })
  pricePeriod: ListingPeriodType;

  @Type(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
