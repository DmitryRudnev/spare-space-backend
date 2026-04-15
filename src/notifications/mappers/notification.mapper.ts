import { Notification } from '../../entities/notification.entity';
import { NotificationResponseDto } from '../dto/responses/notification-response.dto';
import { NotificationListResponseDto } from '../dto/responses/notification-list-response.dto';
import { WsNotificationNewResponseDto } from '../../websocket/dto/responses/ws-notification-new-response.dto';

export class NotificationMapper {
  /**
   * Преобразует сущность уведомления в объект ответа
   */
  static toResponseDto(notification: Notification): NotificationResponseDto {
    const dto = new NotificationResponseDto();

    dto.id = Number(notification.id);
    dto.type = notification.type;
    dto.referenceId = notification.referenceId ? Number(notification.referenceId) : null;
    dto.payload = notification.payload;
    dto.isRead = notification.isRead;
    dto.createdAt = notification.createdAt.toISOString();

    return dto;
  }

  /**
   * Преобразует список сущностей и метаданные в пагинированный ответ
   */
  static toListResponseDto(
    notifications: Notification[],
    total: number,
    limit: number,
    offset: number,
  ): NotificationListResponseDto {
    const dto = new NotificationListResponseDto();

    dto.notifications = notifications.map((notification) => this.toResponseDto(notification));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
  
  static toWsResponseDto(notification: Notification, title: string, body: string): WsNotificationNewResponseDto {
    const dto = new WsNotificationNewResponseDto();

    dto.id = Number(notification.id);
    dto.title = title;
    dto.body = body;
    dto.type = notification.type;
    dto.referenceId = notification.referenceId ? Number(notification.referenceId) : undefined;
    dto.payload = notification.payload || undefined;
    dto.createdAt = notification.createdAt.toISOString();

    return dto;
  }
}
