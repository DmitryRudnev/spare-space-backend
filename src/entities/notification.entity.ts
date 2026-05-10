import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { NotificationType } from '../common/enums/notification-type.enum';
import { AnyNotificationPayload } from '../common/interfaces/notification-payloads.interface';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType, })
  type: NotificationType;

  @Column({ type: 'bigint', nullable: true })
  referenceId: number | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: AnyNotificationPayload | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
