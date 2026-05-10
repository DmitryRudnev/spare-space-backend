import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { NotificationChannel } from '../common/enums/notification-channel.enum';
import { NotificationDeliveryStatus } from '../common/enums/notification-delivery-status.enum';
import { Notification } from './notification.entity';

@Entity('notification_deliveries')
export class NotificationDelivery {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'notification_id', type: 'bigint' })
  notificationId: number;
  
  @ManyToOne(() => Notification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationDeliveryStatus, default: NotificationDeliveryStatus.SUCCESS })
  status: NotificationDeliveryStatus;
  
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
