import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/types';
import { TelegramSetupService } from './telegram-setup.service';

@Injectable()
export class TelegramSenderService {
  private readonly logger = new Logger(TelegramSenderService.name);
  private readonly bot: Telegraf;

  constructor(
    telegramSetupService: TelegramSetupService,
  ) {
    this.bot = telegramSetupService.getBotInstance();
  }

  async sendMessage(
    chatId: number, 
    text: string,
    replyMarkup?: InlineKeyboardMarkup,
    parseMode: 'Markdown' | 'HTML' | 'MarkdownV2' = 'Markdown',
  ): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(chatId, text, {
        parse_mode: parseMode,
        reply_markup: replyMarkup,
      });
      this.logger.log(`Сообщение отправлено в чат ${chatId}`);
      return true;
    } catch (error) {
      this.logger.error(`Ошибка отправки сообщения в чат ${chatId}: ${error.message}`);
      return false;
    }
  }

  
  async editMessageWithKeyboard(
    chatId: number,
    messageId: number,
    text: string,
    keyboard: any,
    parseMode: 'Markdown' | 'HTML' = 'Markdown'
  ): Promise<boolean> {
    try {
      await this.bot.telegram.editMessageText(chatId, messageId, undefined, text, {
        parse_mode: parseMode,
        reply_markup: keyboard.reply_markup,
      });
      return true;
    } catch (error) {
      this.logger.error(`Ошибка редактирования сообщения: ${error.message}`);
      return false;
    }
  }

  
  async sendTempNotification(chatId: number, text: string, durationMs: number = 3000): Promise<void> {
    try {
      const message = await this.bot.telegram.sendMessage(chatId, text);
      setTimeout(async () => {
        try {
          await this.bot.telegram.deleteMessage(chatId, message.message_id);
        } catch (deleteError) {
          this.logger.warn(`Не удалось удалить временное сообщение: ${deleteError.message}`);
        }
      }, durationMs);
    } catch (error) {
      this.logger.error(`Ошибка отправки временного уведомления: ${error.message}`);
    }
  }
  
  
  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean): Promise<void> {
    try {
      await this.bot.telegram.answerCbQuery(callbackQueryId, text, {
        show_alert: showAlert,
        cache_time: 5,
      });
    }
    catch (error) {
      this.logger.error(`Ошибка отправки answerCallbackQuery: ${error.message}`);
    }
  }
}
