import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { NotificationsService } from './notifications.service';
import { NotificationMessageBuilder } from './notification-message-builder.service';

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
      // Если пользователь онлайн → отправляем через вебсокет синхронно
      if (await this.mainWsGateway.isOnline(userId)) {
        await this.handleWebSocketNotification(userId, type, referenceId, payload);
        return;
      }

      // Остальные каналы отправляем через очередь
      await this.notificationsQueue.add(
        'send-notification',
        {
          userId,
          type,
          referenceId,
          payload,
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
}
