import { Injectable, Logger } from '@nestjs/common';
import { Markup } from 'telegraf';
import { TelegramSenderService } from './telegram-sender.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { AnyNotificationPayload, BookingPayload } from '../../common/interfaces/notification-payloads.interface';

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);
  constructor(
    private readonly telegramSenderService: TelegramSenderService,
  ) {}

  
  async sendNotification(
    chatId: number, 
    title: string, 
    body: string, 
    type: NotificationType, 
    payload?: AnyNotificationPayload,
  ): Promise<void> {
    if (type == NotificationType.BOOKING_NEW && payload !== undefined) {
      await this.handleNotificationBookingNew(chatId, payload as BookingPayload);
      return;
    }

    const message = `${title}\n\n${body}`;
    await this.telegramSenderService.sendMessage(chatId, message);
  }


  private async handleNotificationBookingNew(chatId: number, payload: BookingPayload): Promise<void> {
    try {
      let message = `📬 *Новая заявка на бронирование!*\n\n`;
      message += `🏠 *Объект:* ${payload.listingTitle}\n`;
      if (payload.renterName && payload.renterRating) {
        const verifiedString = payload.renterVerified ? 'верифицирован 🟢' : 'не верифицирован 🔴';
        message += `👤 *Арендатор:* ${payload.renterName} — Рейтинг ${payload.renterRating}, ${verifiedString}\n`;
      }
      if (payload.startDate && payload.endDate) {
        message += `📅 *Период:* ${new Date(payload.startDate).toLocaleDateString('ru-RU')} - ${new Date(payload.endDate).toLocaleDateString('ru-RU')}\n`;
      }
      if (payload.price) {
        message += `💰 *Сумма:* ${payload.price} ₽\n\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Принять', `booking:approve:${payload.bookingId}`),
          Markup.button.callback('❌ Отклонить', `booking:reject:${payload.bookingId}`)
        ]
      ]);

      await this.telegramSenderService.sendMessage(chatId, message, keyboard.reply_markup);
    } catch (error) {
      this.logger.error(`Ошибка при отправке уведомления о бронировании: ${error.message}`);
    }
  }
}
