import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { ListingsService } from '../../../listings/listings.service';
import { TelegramSenderService } from '../telegram-sender.service';
import { TelegramPaginationService } from '../telegram-pagination.service';
import { SearchListingsDto } from '../../../listings/dto/requests/search-listings.dto';
import { ListingStatus } from '../../../common/enums/listing-status.enum';
import { CurrencyType } from '../../../common/enums/currency-type.enum';


@Injectable()
export class TelegramListingsHandlerService {
  private readonly logger = new Logger(TelegramListingsHandlerService.name);
  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly paginationService: TelegramPaginationService,
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
  ) {}

  
  async handle(chatId: number, userId: number): Promise<void> {
    try {
      await this.sendListingsPage(chatId, userId, 1);
    } catch (error) {
      this.logger.error(`Ошибка получения объявлений: ${error.message}`);
      await this.telegramSenderService.sendMessage(chatId, '❌ Не удалось загрузить объявления');
    }
  }
  
  
  async sendListingsPage(
    chatId: number,
    userId: number,
    page: number,
    messageId?: number,
  ): Promise<void> {
    const listingsCount = await this.listingsService.countByUser(userId);
    const totalPages = this.paginationService.calculateTotalPages(listingsCount);
    
    if (page < 1) {
      throw new Error('⚠️ Вы уже на первой странице');
    }
    if (page > totalPages && totalPages > 0) {
      throw new Error('⚠️ Вы уже на последней странице');
    }
    if (listingsCount === 0) {
      const noListingsMessage = '📭 У вас пока нет объявлений';
      if (messageId) {
        await this.telegramSenderService.editMessage(
          chatId,
          messageId,
          noListingsMessage,
          { inline_keyboard: [] }
        );
      } else {
        await this.telegramSenderService.sendMessage(chatId, noListingsMessage);
      }
      return;
    }

    // Получаем данные для страницы
    const searchDto: SearchListingsDto = {
      limit: this.paginationService.getItemsPerPage(),
      offset: (page - 1) * this.paginationService.getItemsPerPage(),
    };
    const result = await this.listingsService.findAll(searchDto, undefined, userId);
    const message = this.buildListingsMessage(result.listings, page, result.total);
    const keyboard = this.paginationService.createPaginationKeyboard(page, totalPages, 'listings');
    if (messageId) {
      await this.telegramSenderService.editMessage(chatId, messageId, message, keyboard.reply_markup);
    } else {
      await this.telegramSenderService.sendMessage(chatId, message, keyboard.reply_markup);
    }
  }


  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================


  private buildListingsMessage(listings: any[], page: number, total: number): string {
    let message = `🏠 *Ваши объявления* (всего ${total})\n\n`;
    
    listings.forEach((listing, index) => {
      const totalIndex = (page - 1) * this.paginationService.getItemsPerPage() + index + 1;
      const price = this.isFiat(listing.currency) ? Number(listing.price).toFixed(2)  : listing.price;
      message += 
        `${totalIndex}. *${listing.title}*\n` +
        `📊 Статус: ${this.getStatusText(listing.status)}\n` +
        `📍 Адрес: ${listing.address}\n` +
        `💰 Цена: ${price} ${listing.currency} / ${listing.pricePeriod}\n` +
        // `📝 Описание: ${this.getListingDescription(listing.description)}\n` +
        // `👁️ Просмотры: ${listing.viewsCount}\n` +
        // `🔄 Репосты: ${listing.repostsCount}\n` +
        // `⭐ Избранные: ${listing.favoritesCount}\n` +
        `\n`;
    });
    return message;
  }


  private isFiat(currency: CurrencyType): boolean {
    return currency === CurrencyType.RUB || currency === CurrencyType.USD;
  }


  private getListingDescription(description: string | null): string {
    if (!description) {
      return 'Нет описания';
    }
    if (description.length > 100) {
      return description.substring(0, 100) + '...';
    }
    return description;
  }


  private getStatusText(status: ListingStatus): string {
    const statusMap = {
      [ListingStatus.DRAFT]: '📝 Черновик',
      [ListingStatus.PENDING_APPROVAL]: '⌛ Ждёт подтверждения',
      [ListingStatus.ACTIVE]: '✅ Активно',
      [ListingStatus.REJECTED]: '🚫 Отклонено',
      [ListingStatus.INACTIVE]: '❌ Неактивно',
    };
    return statusMap[status] || `📄 ${status}`;
  }
}
