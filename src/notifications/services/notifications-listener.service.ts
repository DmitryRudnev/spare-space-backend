import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';
import { NotificationsService } from './notifications.service';
import { UsersService } from '../../users/services/users.service';
import { DevicesService } from '../../devices/devices.service';
import { MainWebSocketGateway } from '../../websocket/websocket.gateway';
import { TelegramNotificationService } from '../../telegram/services/telegram-notification.service';
import { NotificationMapper } from '.././mappers/notification.mapper';
import { FcmNotificationsService } from './fcm-notifications.service';
import { AnyNotificationPayload } from '../../common/interfaces/notification-payloads.interface';
import { NotificationMessageBuilder } from './notification-message-builder.service';

@Injectable()
export class NotificationsListenerService {
  private readonly logger = new Logger(NotificationsListenerService.name);
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly mainWsGateway: MainWebSocketGateway,
    private readonly telegramNotificationService: TelegramNotificationService,
    private readonly fcmNotificationsService: FcmNotificationsService,
    private readonly notificationMessageBuilder: NotificationMessageBuilder,
  ) {}

  @OnEvent('notification.signal')
  async handleNotificationSignal(data: {
    userId: number;
    type: NotificationType;
    referenceId?: number;
    payload?: AnyNotificationPayload;
  }): Promise<void> {
    const { userId, type, referenceId, payload } = data;

    try {
      // Если пользователь онлайн, то просто шлём через вебсокет
      if (await this.mainWsGateway.isOnline(userId)) {
        await this.handleWebSocketNotification(userId, type, referenceId, payload);
        return;
      }

      // Получаем пользовательские настройки уведомлений
      const settings = await this.notificationsService.getUserNotificationSettings(userId);

      // FCM
      if (settings.sendPush) {
        this.handleFcmNotification(userId, type, referenceId, payload);
      }

      // TG bot
      if (settings.sendTgBot) {
        this.handleTelegramNotification(userId, type, referenceId, payload);
      }
    }
    catch (error) {
      this.logger.error(`Failed to handle notification signal for user ${userId}:`, error);
    }
  }


  private async handleWebSocketNotification(
    userId: number,
    type: NotificationType,
    referenceId?: number,
    payload?: AnyNotificationPayload,
  ): Promise<void> {
    const notification = await this.notificationsService.create(
      userId,
      type,
      NotificationChannel.WEBSOCKET,
      referenceId,
      payload
    );
    const { title, body } = this.notificationMessageBuilder.build(type, payload);
    const wsNotification = NotificationMapper.toWsResponseDto(notification, title, body);
    await this.mainWsGateway.sendNotificationToUser(userId, wsNotification);
  }


  private async handleFcmNotification(
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

    await this.notificationsService.create(
      userId,
      type,
      NotificationChannel.FCM,
      referenceId,
      payload
    );

    const { title, body } = this.notificationMessageBuilder.build(type, payload);
    await this.fcmNotificationsService.sendPush(
      tokens,
      title,
      body,
      type,
      payload,
    );
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
