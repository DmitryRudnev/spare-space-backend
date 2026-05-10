import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { FcmNotificationsService } from './fcm-notifications.service';
import { NotificationMessageBuilder } from './notification-message-builder.service';

import { UsersService } from '../../users/services/users.service';
import { DevicesService } from '../../devices/devices.service';
import { TelegramNotificationService } from '../../telegram/services/telegram-notification.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';
import { AnyNotificationPayload } from '../../common/interfaces/notification-payloads.interface';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly fcmNotificationsService: FcmNotificationsService,
    private readonly telegramNotificationService: TelegramNotificationService,
    private readonly notificationMessageBuilder: NotificationMessageBuilder,
  ) { super(); }

  async process(
    job: Job<{
      userId: number;
      type: NotificationType;
      payload?: AnyNotificationPayload;
      notificationId: number;
    }>,
  ): Promise<void> {
    const { userId, type, payload, notificationId } = job.data;

    try {
      // FCM
      this.logger.log(`Processing push notification for user ${userId}`);
      await this.handlePushNotification(userId, type, notificationId, payload);

      // TG bot
      this.logger.log(`Processing Telegram notification for user ${userId}`);
      await this.handleTelegramNotification(userId, type, notificationId, payload);

    } catch (error) {
      this.logger.error(`Failed to process notification for user ${userId}:`, error);
      throw error;
    }
  }

  private async handlePushNotification(
    userId: number,
    type: NotificationType,
    notificationId: number,
    payload?: AnyNotificationPayload,
  ): Promise<void> {
    const tokens = await this.devicesService.getUserTokens(userId);
    if (tokens.length === 0) {
      this.logger.warn(`No push tokens found for user ${userId}`);
      return;
    }

    await this.notificationsService.createDelivery(notificationId, NotificationChannel.FCM);
    const { title, body } = this.notificationMessageBuilder.build(type, payload);
    await this.fcmNotificationsService.sendPush(tokens, title, body, type, payload);
  }
  
  private async handleTelegramNotification(
    userId: number,
    type: NotificationType,
    notificationId: number,
    payload?: AnyNotificationPayload,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    
    if (!user.telegramChatId) {
      this.logger.warn(`User ${userId} has no telegram chat ID`);
      return;
    }

    await this.notificationsService.createDelivery(notificationId, NotificationChannel.TG_BOT);
    const { title, body } = this.notificationMessageBuilder.build(type, payload);
    await this.telegramNotificationService.sendNotification(user.telegramChatId, title, body, type, payload);
  }
}
