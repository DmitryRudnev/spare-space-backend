import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationsService } from './notifications.service';
import { FcmNotificationsService } from './fcm-notifications.service';
import { ExpoNotificationsService } from './expo-notifications.service';
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
  private readonly pushProvider: string;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly fcmNotificationsService: FcmNotificationsService,
    private readonly expoNotificationsService: ExpoNotificationsService,
    private readonly telegramNotificationService: TelegramNotificationService,
    private readonly notificationMessageBuilder: NotificationMessageBuilder,
    private readonly configService: ConfigService,
  ) {
    super();
    const provider = this.configService.getOrThrow<string>('PUSH_PROVIDER');
    if (provider !== 'fcm' && provider !== 'expo') {
      throw new Error(`Invalid PUSH_PROVIDER env variable: "${provider}". Allowed values: fcm, expo`);
    }
    this.pushProvider = provider;
  }

  async process(
    job: Job<{
      userId: number;
      type: NotificationType;
      referenceId?: number;
      payload?: AnyNotificationPayload;
    }>,
  ): Promise<void> {
    const { userId, type, referenceId, payload } = job.data;

    try {
      const settings = await this.notificationsService.getUserNotificationSettings(userId);

      // FCM или EXPO
      if (settings.sendPush) {
        await this.handlePushNotification(userId, type, referenceId, payload);
      }

      // TG bot
      if (settings.sendTgBot) {
        await this.handleTelegramNotification(userId, type, referenceId, payload);
      }
    } catch (error) {
      this.logger.error(`Failed to process notification for user ${userId}:`, error);
      throw error;
    }
  }

  private async handlePushNotification(
    userId: number,
    type: NotificationType,
    referenceId?: number,
    payload?: AnyNotificationPayload,
  ): Promise<void> {
    const tokens = await this.devicesService.getUserTokens(userId);
    if (tokens.length === 0) {
      this.logger.warn(`No push tokens found for user ${userId}`);
      return;
    }

    const sendByFCM = this.pushProvider === 'fcm';
    const targetTokens = sendByFCM
      ? tokens.filter(t => !this.expoNotificationsService.isExpoToken(t))
      : tokens.filter(t => this.expoNotificationsService.isExpoToken(t));

    if (targetTokens.length === 0) {
      this.logger.warn(`No ${this.pushProvider} tokens found for user ${userId}`);
      return;
    }

    await this.notificationsService.create(
      userId,
      type,
      sendByFCM ? NotificationChannel.FCM : NotificationChannel.EXPO,
      referenceId,
      payload
    );

    const { title, body } = this.notificationMessageBuilder.build(type, payload);
    if (sendByFCM) {
      await this.fcmNotificationsService.sendPush(tokens, title, body, type, payload);
    } else {
      await this.expoNotificationsService.sendPush(tokens, title, body, type, payload);
    }
  }
  
  
  private async handleTelegramNotification(
    userId: number,
    type: NotificationType,
    referenceId?: number,
    payload?: AnyNotificationPayload,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    
    if (!user.telegramChatId) {
      this.logger.warn(`User ${userId} has no telegram chat ID`);
      return;
    }

    await this.notificationsService.create(
      userId,
      type,
      NotificationChannel.TG_BOT,
      referenceId,
      payload
    );

    const { title, body } = this.notificationMessageBuilder.build(type, payload);
    await this.telegramNotificationService.sendNotification(user.telegramChatId, title, body, type, payload);
  }
}
