import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { AnyNotificationPayload } from '../../../common/interfaces/notification-payloads.interface';

export class NotificationResponseDto {
  @ApiProperty({ type: Number, description: 'ID уведомления', example: 1 })
  id: number;

  @ApiProperty({ enum: NotificationType, description: 'Тип события', example: NotificationType.BOOKING_NEW })
  type: NotificationType;

  @ApiProperty({ type: Number, description: 'ID связанной сущности (брони, объявления и т.д.)', example: 42, nullable: true })
  referenceId: number | null;

  @ApiProperty({ 
    type: Object,
    description: 'Данные уведомления (содержание зависит от типа)',
    example: { bookingId: 1, listingTitle: 'Гараж' },
    nullable: true,
  })
  payload: AnyNotificationPayload | null;

  @ApiProperty({ type: Boolean, description: 'Статус прочтения', example: false })
  isRead: boolean;

  @ApiProperty({ type: String, description: 'Дата создания (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;
}
