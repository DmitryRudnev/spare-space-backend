// src/notifications/services/expo-notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevicesService } from '../../devices/devices.service';
import { AnyNotificationPayload } from '../../common/interfaces/notification-payloads.interface';
import { NotificationType } from '../../common/enums/notification-type.enum';

interface ExpoPushMessage {
  to: string;
  sound?: string;
  title?: string;
  body?: string;
  data?: any;
  priority?: 'default' | 'normal' | 'high';
}

@Injectable()
export class ExpoNotificationsService {
  private readonly logger = new Logger(ExpoNotificationsService.name);
  private readonly EXPO_API_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(
    private readonly configService: ConfigService,
    private readonly devicesService: DevicesService,
  ) {}

  /**
   * Проверяет, является ли токен Expo токеном
   */
  isExpoToken(token: string): boolean {
    return token.startsWith('ExponentPushToken[');
  }

  /**
   * Отправляет уведомления через Expo API
   */
  async sendPush(
    tokens: string[],
    title: string,
    body: string,
    type: NotificationType,
    payload?: AnyNotificationPayload
  ): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    // Разделяем токены на Expo и FCM
    const expoTokens = tokens.filter(t => this.isExpoToken(t));
    const fcmTokens = tokens.filter(t => !this.isExpoToken(t));

    // Отправляем Expo токены через Expo API
    if (expoTokens.length > 0) {
      await this.sendExpoPush(expoTokens, title, body, type, payload);
    }

    // FCM токены будут обработаны в другом сервисе
    if (fcmTokens.length > 0) {
      this.logger.log(`${fcmTokens.length} FCM tokens require separate handling`);
      // Здесь можно вызвать FCM сервис или вернуть их для обработки
    }
  }

  /**
   * Отправляет уведомления через Expo API
   */
  private async sendExpoPush(
    tokens: string[],
    title: string,
    body: string,
    type: NotificationType,
    payload?: AnyNotificationPayload
  ): Promise<void> {
    // Формируем сообщения для Expo
    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        type,
        ...payload,
      },
      priority: 'high',
    }));

    try {
      const response = await fetch(this.EXPO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Expo API error: ${response.status}`);
      }

      // Анализируем результаты
      await this.handleExpoResponse(tokens, result);

    } catch (error) {
      this.logger.error('Expo Push send error:', error);
    }
  }

  /**
   * Обрабатывает ответ от Expo API
   */
  private async handleExpoResponse(
    tokens: string[],
    response: any
  ): Promise<void> {
    if (!response.data || !Array.isArray(response.data)) {
      this.logger.error('Invalid Expo response format');
      return;
    }

    const invalidTokens: string[] = [];

    response.data.forEach((item: any, index: number) => {
      if (item.status === 'error') {
        // Проверяем ошибки, связанные с невалидными токенами
        if (this.isInvalidExpoTokenError(item)) {
          invalidTokens.push(tokens[index]);
          this.logger.debug(`Invalid Expo token: ${tokens[index]}`);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await this.devicesService.deleteTokens(invalidTokens);
      this.logger.log(`Removed ${invalidTokens.length} invalid Expo tokens`);
    }

    // Логируем статистику
    const successCount = response.data.filter((item: any) => item.status === 'ok').length;
    this.logger.log(`Expo push: ${successCount} successful, ${invalidTokens.length} invalid tokens`);
  }

  /**
   * Проверяет, является ли ошибка связанной с невалидным токеном
   */
  private isInvalidExpoTokenError(error: any): boolean {
    const invalidErrors = [
      'DeviceNotRegistered',
      'InvalidCredentials',
      'MessageTooBig',
    ];

    return error.details?.error && invalidErrors.includes(error.details.error);
  }
}