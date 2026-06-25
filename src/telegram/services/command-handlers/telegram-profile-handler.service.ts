import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { TelegramSenderService } from '../telegram-sender.service';

@Injectable()
export class TelegramProfileHandlerService {
  private readonly logger = new Logger(TelegramProfileHandlerService.name);
  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly usersService: UsersService,
  ) {}


  async handle(chatId: number, userId: number): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      const renterRating = await this.getRatingString(user.renterRating, user.renterReviewCount);
      const landlordRating = await this.getRatingString(user.landlordRating, user.landlordReviewCount);

      const message = `📋 *Ваш профиль*\n\n` +
        `👤 Имя: ${user.firstName} ${user.lastName}\n` +
        `📞 Телефон: ${user.phone}\n` +
        `📧 Email: ${user.email}\n` +
        `⭐ Рейтинг арендатора: ${renterRating}\n` +
        `🏡 Рейтинг владельца: ${landlordRating}\n` +
        `🔐 2FA: ${user.twoFaEnabled ? '🟢 Включена' : '🔴 Выключена'}\n` +
        `🆔 Верифицирован: ${user.verified ? '✅ Да' : '❌ Нет'}`;

      await this.telegramSenderService.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Ошибка получения профиля: ${error.message}`);
      await this.telegramSenderService.sendMessage(chatId, '❌ He удалось загрузить профиль');
    }
  }


  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================


  private async getRatingString(rating: number | null, reviewCount: number): Promise<string> {
    if (rating) {
      const reviewWord = this.getReviewWord(reviewCount);
      return `${rating} (${reviewCount} ${reviewWord})`;
    }
    return "нет отзывов";
  }

  
  private getReviewWord(reviewCount: number): string {
    const reviewWord = 'отзыв';
    
    const count100 = reviewCount % 100;
    if (11 <= count100 && count100 <= 14) {
      return reviewWord + 'ов';
    }
    
    const count = reviewCount % 10;
    if (count === 1) {
      return reviewWord;
    }
    if (2 <= count && count <= 4) {
      return reviewWord + 'a';
    }
    return reviewWord + 'ов';
  }
}
