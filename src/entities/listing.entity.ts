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
import { Type } from 'class-transformer';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingType } from '../common/enums/listing-type.enum';

import { User } from './user.entity';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Type(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ListingType, enumName: 'listing_type' })
  type: ListingType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: ListingPeriodType,
    enumName: 'listing_period_type',
    default: ListingPeriodType.DAY,
  })
  pricePeriod: ListingPeriodType;

  @Type(() => Object)
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

  @Type(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Type(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Если availability в рантайме не string[], а string, то преобразует в string[]
   * То есть, гарантированно возвращает массив строк периодов tstzrange
   * Пример возврата: ["[2026-01-01T00:00:00Z,2026-01-07T00:00:00Z)", "[2026-01-14T00:00:00Z,2026-01-21T00:00:00Z)"]
   */
  get availabilityPeriodStrings(): string[] {
    if (!this.availability) {
      return [];
    }
    if (typeof this.availability === 'string') {
      return this.parseStringAvailability(this.availability);
    }
    if (Array.isArray(this.availability)) {
      return this.availability;
    }
    throw new Error(`Invalid availability type: ${typeof this.availability}`);
  }

  /**
   * Парсит availability, приводя список строк к списку объектов, содержащих даты доступности
   */
  get availabilityPeriodDates(): { start: Date; end: Date }[] {
    return this.availabilityPeriodStrings.map(period => this.parseStringPeriod(period));
  }

  private parseStringAvailability(stringAvailability: string): string[] {
    if (!stringAvailability || stringAvailability === '{}') {
      return [];
    }
    const result = stringAvailability
      .trim()
      .replace(/^{/, '')
      .replace(/}$/, '')
      .replace(/\\"/g, '')
      .replace(/"/g, '')
      .match(/\[.+?\)/g);
    return result ?? [];
  }

  private parseStringPeriod(stringPeriod: string): { start: Date; end: Date } {
    const trimmed = stringPeriod.trim();
    if (!/^\[[^,]+,[^,]+\)$/.test(trimmed)) {
      throw new Error(`Invalid availability period stored in database: ${trimmed}`);
    }
    const parts = trimmed.slice(1, -1).split(',').map(s => s.trim());
    if (parts.length !== 2) {
      throw new Error(`Invalid availability period stored in database: ${stringPeriod}`);
    }
    return {
      start: new Date(parts[0]),
      end: new Date(parts[1]),
    };
  }
}
