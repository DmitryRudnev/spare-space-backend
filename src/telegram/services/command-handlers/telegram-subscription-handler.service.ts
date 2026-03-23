import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { UserSubscriptionsService } from '../../../subscriptions//services/user-subscriptions.service';
import { TelegramSenderService } from '../telegram-sender.service';
import { UserSubscription } from '../../../entities/user-subscription.entity';
import { CurrencyType } from 'src/common/enums/currency-type.enum';

@Injectable()
export class TelegramSubscriptionHandlerService {
  private readonly logger = new Logger(TelegramSubscriptionHandlerService.name);
  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly usersService: UsersService,
    private readonly userSubscriptionsService: UserSubscriptionsService,

  ) {}


  async handle(chatId: number, userId: number): Promise<void> {
    try {
      const { subscriptions } = await this.userSubscriptionsService.findByUser(userId, 1, 0);
      if (!subscriptions.length) {
        await this.sendNoSubscriptionMessage(chatId);
        return;
      }

      const subscription = subscriptions[0];
      const message = this.buildSubscriptionMessage(subscription);
      await this.telegramSenderService.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Ошибка получения подписки: ${error.message}`);
      await this.telegramSenderService.sendMessage(chatId, '❌ Не удалось загрузить информацию о подписке');
    }
  }


  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================

  
  private buildSubscriptionMessage(subscription: UserSubscription): string {
    const plan = subscription.plan;
    const formattedPrice = this.isFiat(plan.currency) ? 
          Number(plan.price).toFixed(2) : 
          plan.price;
    const period = this.formatSubscriptionPeriod(subscription.startDate, subscription.endDate);
    const daysLeft = this.calculateDaysLeft(subscription.endDate);
    
    let message = `🎫 *Ваша текущая подписка*\n\n` +
      `📋 *План:* ${this.sanitizeMarkdown(plan.name)}\n` +
      `💰 *Стоимость:* ${formattedPrice} ${plan.currency}\n` +
      `🕒 *Период:* ${period}\n` +
      `${daysLeft}\n\n` +
      `⚡ *Возможности:*\n` +
      `• Объявления: ${plan.maxListings} шт.\n` +
      `• Приоритет в поиске: ${plan.prioritySearch ? '✅' : '❌'}\n` +
      `• Бусты в месяц: ${plan.boostsPerMonth} шт.\n`;

    if (plan.extraFeatures && Object.keys(plan.extraFeatures).length > 0) {
      message += `\n🎁 *Дополнительно:*\n`;
      Object.entries(plan.extraFeatures).forEach(([key, value]) => {
        message += `• ${this.sanitizeMarkdown(key)}: ${this.sanitizeMarkdown(String(value))}\n`;
      });
    }
    
    return message;
  }


  private isFiat(currency: CurrencyType): boolean {
    return currency === CurrencyType.RUB || currency === CurrencyType.USD;
  }


  private formatSubscriptionPeriod(startDate: Date, endDate: Date | null): string {
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = endDate ? new Date(endDate).toLocaleDateString('ru-RU') : '∞';
    return `${start} - ${end}`;
  }


  private calculateDaysLeft(endDate: Date | null): string {
    if (!endDate) {
      return `♾️ *Бессрочная* подписка`;
    }
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `⏳ Осталось *${daysLeft}* ${this.getDaysWord(daysLeft)}`;
  }


  private getDaysWord(daysCount: number): string {
    const count100 = daysCount % 100;
    if (11 <= count100 && count100 <= 14)  return 'дней';
    
    const count = daysCount % 10;
    if (count === 1)  return 'день';
    if (2 <= count && count <= 4)  return 'дня';
    return 'дней';
  }


  private sanitizeMarkdown(text: string): string {
    return text
      .replace(/[_*[\]()~`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  
  private async sendNoSubscriptionMessage(chatId: number): Promise<void> {
    const message = `📭 *У вас нет активной подписки*\n\n` +
      `Для доступа к расширенным возможностям аренды рекомендуем оформить подписку.\n\n` +
      `💡 *Преимущества подписки:*\n` +
      `• Больше объявлений\n` +
      `• Приоритет в поиске\n` +
      `• Дополнительные бусты\n` +
      `• Расширенные статистики\n\n` +
      `Оформить подписку можно в веб-приложении в разделе "Подписки".`;

    await this.telegramSenderService.sendMessage(chatId, message);
  }
}
