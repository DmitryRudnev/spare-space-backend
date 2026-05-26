import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Type } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  patronymic: string | null;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number | null;

  @Column({ default: false })
  isOnline: boolean;

  @Type(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  lastSeenAt: Date;

  @Column({ type: 'bigint', nullable: true })
  telegramId: number | null;

  @Column({ type: 'bigint', nullable: true })
  telegramChatId: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  telegramUsername: string | null;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ default: false })
  twoFaEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  twoFaSecret: string | null;

  @Column({ type: 'jsonb', nullable: true })
  twoFaRecoveryCodesHashes: string[] | null;

  @Type(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Type(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
