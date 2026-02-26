import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from '../entities/notification.entity';
import { NotificationSetting } from '../entities/notification-setting.entity';
import { UsersModule } from '../users/users.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { DevicesModule } from '../devices/devices.module';
import { TelegramModule } from '../telegram/telegram.module';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationsListenerService } from './services/notifications-listener.service';
import { FcmNotificationsService } from './services/fcm-notifications.service';
import { ExpoNotificationsService } from './services/expo-notifications.service';
import { NotificationMessageBuilder } from './services/notification-message-builder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationSetting]), 
    UsersModule, 
    WebSocketModule, 
    DevicesModule,
    TelegramModule
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsListenerService,
    FcmNotificationsService,
    ExpoNotificationsService,
    NotificationMessageBuilder,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
