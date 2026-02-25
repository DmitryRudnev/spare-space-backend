import { Injectable, Logger } from '@nestjs/common';
import type { TelegramWebhookUpdate, TelegramMessage, TelegramCallbackQuery } from '../interfaces';
import { UsersService } from '../../users/services/users.service';
import { TelegramStartHandlerService,
  TelegramProfileHandlerService,
  TelegramListingsHandlerService,
  TelegramBookingsHandlerService,
  TelegramSubscriptionHandlerService,
  TelegramWalletHandlerService,
 } from './command-handlers';
 import { TelegramSenderService } from './telegram-sender.service';
import { PaginationCallbackData } from '../dto/callback-data.dto';
import { UserRoleType } from '../../common/enums/user-role-type.enum';


@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly startHandlerService: TelegramStartHandlerService,
    private readonly profileHandlerService: TelegramProfileHandlerService,
    private readonly listingsHandlerService: TelegramListingsHandlerService,
    private readonly bookingsHandlerService: TelegramBookingsHandlerService,
    private readonly subscriptionHandlerService: TelegramSubscriptionHandlerService,
    private readonly walletHandlerService: TelegramWalletHandlerService,
    private readonly usersService: UsersService,
  ) {}


  async handleUpdate(update: TelegramWebhookUpdate): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      } else {
        this.logger.error('Ещё не реализована обработка данного типа обновления от телеграма');
      }
    } catch (error) {
      this.logger.error(`Ошибка обработки обновления: ${error.message}`, {
        updateId: update.update_id,
        stack: error.stack
      });
    }
  }

  
  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================


  private async handleMessage(message: TelegramMessage): Promise<void> {
    if (!message.from || !message.text) {
      this.logger.error('Отсутствует информация об отправителе или тексте сообщения');
      return;
    }

    const telegramId = message.from.id;
    const command = message.text.trim();
    const chatId = message.chat.id;

    if (!command.startsWith('/')) {
      await this.telegramSenderService.sendMessage(chatId, 'Команда должна начинаться с "/"');
      return;
    }

    if (command.startsWith('/start')) {
      const verificationToken = command.split(/\s+/)[1];
      await this.startHandlerService.handle(telegramId, chatId, verificationToken);
      return;
    } else if (command.startsWith('/help')) {
      await this.sendHelpMessage(chatId);
      return;
    }

    let userId: number;
    try {
      userId = Number((await this.usersService.findByTelegramId(telegramId)).id);
    } catch (error) {
      await this.startHandlerService.sendBindingInstructions(chatId);
      return;
    }

    if (command.startsWith('/profile')) {
      await this.profileHandlerService.handle(chatId, userId);
    } else if (command.startsWith('/listings')) {
      await this.listingsHandlerService.handle(chatId, userId);
    } else if (command.startsWith('/bookings')) {
      await this.bookingsHandlerService.handle(chatId, userId);
    } else if (command.startsWith('/subscription')) {
      await this.subscriptionHandlerService.handle(chatId, userId);
    } else if (command.startsWith('/wallet')) {
      await this.walletHandlerService.handle(chatId, userId);
    } else {
      await this.sendHelpMessage(chatId);
    }
  }


  private async handleCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<void> {
    try {
      const { id: callbackId, data, from, message } = callbackQuery;
      const telegramId = from.id;
      const chatId = message?.chat.id;
      const messageId = message?.message_id;

      if (!data || !chatId || !messageId) {
        await this.telegramSenderService.answerCallbackQuery(callbackId, '⚠️ Ошибка обработки запроса');
        this.logger.error('Недостаточно данных в callback query');
        return;
      }
      if (data === 'noop') {
        await this.telegramSenderService.answerCallbackQuery(callbackId);
        return;
      }

      let userId: number;
      try {
        userId = Number((await this.usersService.findByTelegramId(telegramId)).id);
      } catch (error) {
        await this.telegramSenderService.answerCallbackQuery(callbackId, '❌ Сначала привяжите аккаунт');
        await this.startHandlerService.sendBindingInstructions(chatId);
        return;
      }


      if (data.startsWith('booking:')) {
        await this.telegramSenderService.answerCallbackQuery(callbackId);
        const action = data.split(':')[1];
        const bookingId = Number(data.split(':')[2]);
        await this.bookingsHandlerService.handleBookingStatusUpdate(chatId, messageId, userId, bookingId, action);
        return;
      }

      if (data.startsWith('bookings:role:')) {
        await this.telegramSenderService.answerCallbackQuery(callbackId);
        const roleStr = data.split(':')[2];
        const role = roleStr === 'landlord' ? UserRoleType.LANDLORD : UserRoleType.RENTER;
        await this.bookingsHandlerService.sendBookingsPage(chatId, messageId, userId, role, 1);
        return;
      }

      if (data.startsWith('listings:') || data.startsWith('bookings:')) {
        const callbackData = PaginationCallbackData.fromString(data);

        // --- Обработка объявлений ---
        if (callbackData.entity === 'listings') {
          await this.telegramSenderService.answerCallbackQuery(callbackId);
          await this.listingsHandlerService.sendListingsPage(chatId, userId, callbackData.page, messageId);
        }
        
        // --- Обработка бронирований ---
        else if (callbackData.entity === 'bookings') {
          await this.telegramSenderService.answerCallbackQuery(callbackId);
          const role = callbackData.extra === 'landlord' ? UserRoleType.LANDLORD : UserRoleType.RENTER;
          await this.bookingsHandlerService.sendBookingsPage(chatId, messageId, userId, role, callbackData.page);
        }
      }
    } catch (error) {
      this.logger.error(`Ошибка обработки callback query: ${error.message}`);
      await this.telegramSenderService.answerCallbackQuery(callbackQuery.id, error.message, true);
    }
  }


  private async sendHelpMessage(chatId: number): Promise<void> {
    const message = `🆘 *Доступные команды:*\n\n` +
      `🔹 /start - Начало работы с ботом\n` +
      `👤 /profile - Просмотр профиля\n` +
      `🏠 /listings - Мои объявления\n` +
      `📅 /bookings - Мои бронирования\n` +
      `🎫 /subscription - Информация о подписке\n` +
      `💰 /wallet - Баланс и транзакции\n` +
      `🆘 /help - Эта справка`;

    await this.telegramSenderService.sendMessage(chatId, message);
  }
}
