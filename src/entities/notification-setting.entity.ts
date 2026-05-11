import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, UpdateDateColumn, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_notification_settings')
export class NotificationSetting {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: true })
  sendPush: boolean;

  @Column({ default: true })
  sendTgBot: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
