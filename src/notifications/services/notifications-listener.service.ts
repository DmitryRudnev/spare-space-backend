import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { NotificationsService } from './notifications.service';
import { NotificationMessageBuilder } from './notification-message-builder.service';

import { Notification } from '../../entities/notification.entity';
import { NotificationMapper } from '../mappers/notification.mapper';
import { MainWebSocketGateway } from '../../websocket/websocket.gateway';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';
import { AnyNotificationPayload } from '../../common/interfaces/notification-payloads.interface';

@Injectable()
export class NotificationsListenerService {
  private readonly logger = new Logger(NotificationsListenerService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly mainWsGateway: MainWebSocketGateway,
    private readonly notificationMessageBuilder: NotificationMessageBuilder,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {
  }

  @OnEvent('notification.signal')
  async handleNotificationSignal(data: {
    userId: number;
    type: NotificationType;
    referenceId?: number;
    payload?: AnyNotificationPayload;
  }): Promise<void> {
    const { userId, type, referenceId, payload } = data;

    try {
      const notification = await this.notificationsService.create(userId, type, referenceId, payload);

      // Если пользователь онлайн → отправляем через вебсокет синхронно
      if (await this.mainWsGateway.isOnline(userId)) {
        this.logger.log(`User ${userId} is online. Sending notification via WebSocket.`);
        await this.handleWebSocketNotification(notification, userId, type, payload);
      }

      // Остальные каналы отправляем через очередь
      this.logger.log(`Adding notification (for user ${userId}) to queue.`);
      await this.notificationsQueue.add(
        'send-notification',
        {
          userId,
          type,
          payload,
          notificationId: notification.id
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }
    catch (error) {
      this.logger.error(`Failed to handle notification signal for user ${userId}:`, error);
    }
  }

  private async handleWebSocketNotification(
    notification: Notification,
    userId: number,
    type: NotificationType,
    payload?: AnyNotificationPayload,
  ): Promise<void> {
    await this.notificationsService.createDelivery(notification.id, NotificationChannel.WEBSOCKET);
    const { title, body } = this.notificationMessageBuilder.build(type, payload);
    const wsNotification = NotificationMapper.toWsResponseDto(notification, title, body);
    await this.mainWsGateway.sendNotificationToUser(userId, wsNotification);
  }
}
