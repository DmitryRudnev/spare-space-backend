import { Injectable, Logger } from '@nestjs/common';
import { Markup } from 'telegraf';
import { UsersService } from '../../../users/services/users.service';
import { BookingsService } from '../../../bookings/bookings.service';
import { TelegramSenderService } from '../telegram-sender.service';
import { SearchBookingsDto } from '../../../bookings/dto/requests/search-bookings.dto';
import { UserRoleType } from '../../../common/enums/user-role-type.enum';
import { BookingStatus } from '../../../common/enums/booking-status.enum';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { TelegramPaginationService } from '../telegram-pagination.service';

@Injectable()
export class TelegramBookingsHandlerService {
  private readonly logger = new Logger(TelegramBookingsHandlerService.name);
  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly paginationService: TelegramPaginationService,
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
  ) {}


  async handle(chatId: number, userId: number): Promise<void> {
    try {
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📤 Я арендатор', 'bookings:role:renter'),
          Markup.button.callback('📥 Я арендодатель', 'bookings:role:landlord'),
        ],
      ]);

      await this.telegramSenderService.sendMessage(
        chatId,
        '📅 *Мои бронирования*\n\nВыберите категорию бронирований:',
        keyboard.reply_markup
      );
    } catch (error) {
      this.logger.error(`Ошибка при запуске хендлера бронирований: ${error.message}`);
      await this.telegramSenderService.sendMessage(chatId, '❌ Произошла ошибка');
    }
  }

  
  async sendBookingsPage(
    chatId: number,
    messageId: number,
    userId: number,
    role: UserRoleType,
    page: number,
  ): Promise<void> {
    const bookingsCount = await this.bookingsService.countByUser(userId, role);
    const totalPages = this.paginationService.calculateTotalPages(bookingsCount);

    if (page < 1) {
      throw new Error('⚠️ Вы уже на первой странице');
    }
    if (page > totalPages && totalPages > 0) {
      throw new Error('⚠️ Вы уже на последней странице');
    }
    if (bookingsCount === 0) {
      const emptyText = role === UserRoleType.LANDLORD 
        ? '📭 Вы ничего не сдавали в аренду.' 
        : '📭 Вы ничего не арендовали.';
      
      await this.telegramSenderService.editMessage(
        chatId, messageId, emptyText, { inline_keyboard: [] }
      );
      return;
    }

    const searchDto: SearchBookingsDto = {
      userRole: role,
      limit: this.paginationService.getItemsPerPage(),
      offset: (page - 1) * this.paginationService.getItemsPerPage(),
    };
    const result = await this.bookingsService.findAll(userId, searchDto);
    const message = this.buildBookingsMessage(result.bookings, page, result.total, role);
    const roleStr = role === UserRoleType.LANDLORD ? 'landlord' : 'renter';
    const keyboard = this.paginationService.createPaginationKeyboard(page, totalPages, 'bookings', roleStr);
    await this.telegramSenderService.editMessage(chatId, messageId, message, keyboard.reply_markup);
  }


  async handleBookingStatusUpdate(
    chatId: number,
    messageId: number,
    userId: number,
    bookingId: number,
    action: string,
  ): Promise<void> {
    switch (action) {
      case 'approve':
        await this.bookingsService.handleConfirm(userId, bookingId);
        await this.telegramSenderService.sendMessage(chatId, '✅ Бронирование подтверждено!');
        await this.telegramSenderService.editMessage(chatId, messageId, undefined, { inline_keyboard: [] })
        break;
      case 'reject':
        await this.bookingsService.handleCancel(userId, bookingId);
        await this.telegramSenderService.sendMessage(chatId, '↩️ Бронирование отклонено!');
        await this.telegramSenderService.editMessage(chatId, messageId, undefined, { inline_keyboard: [] })
        break;
      default:
        throw new Error('⚠️ Неизвестный тип обновления стаутса бронирования');
    }
  }


  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================

  
  private buildBookingsMessage(bookings: any[], page: number, total: number, role: UserRoleType): string {
    const roleTitle = role === UserRoleType.LANDLORD ? 'Вы арендодатель' : 'Вы арендатор';
    let message = `📅 *${roleTitle}* (всего ${total})\n\n`;

    bookings.forEach((booking, index) => {
      const totalIndex = (page - 1) * this.paginationService.getItemsPerPage() + index + 1;
      const formattedPrice = this.isFiat(booking.currency) ? Number(booking.totalPrice).toFixed(2) : booking.totalPrice;
      const formattedPeriod = this.formatPeriod(booking.period, booking.listing.pricePeriod);
      
      const isLandlordView = role === UserRoleType.LANDLORD;
      const otherParty = isLandlordView ? 
        `👤 Арендатор: ${booking.renter.firstName} ${booking.renter.lastName}` :
        `👤 Владелец: ${booking.listing.user.firstName} ${booking.listing.user.lastName}`;

      message += 
        `${totalIndex}. *${booking.listing.title}*\n` +
        `${otherParty}\n` +
        `📊 Статус: ${this.getStatusText(booking.status)}\n` +
        `🕒 Период: ${formattedPeriod}\n` +
        `💰 Цена: ${formattedPrice} ${booking.currency}\n` +
        `\n`;
    });
    return message;
  }

  
  private isFiat(currency: CurrencyType): boolean {
    return currency === CurrencyType.RUB || currency === CurrencyType.USD;
  }


  private formatPeriod(period: string, pricePeriod: ListingPeriodType): string {
    try {
      const matches = period.match(/\[(.*),(.*)\)/);
      if (matches) {
        const startDate = new Date(matches[1]);
        const endDate = new Date(matches[2]);

        if (pricePeriod === ListingPeriodType.HOUR) {
          return `${startDate.toLocaleString('ru-RU')} - ${endDate.toLocaleString('ru-RU')}`;    
        }
        return `${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`;
      }
      return period;
    } catch {
      return period;
    }
  }

  
  private getStatusText(status: BookingStatus): string {
    const statusMap = {
      [BookingStatus.PENDING]: '⏳ Ожидание',
      [BookingStatus.CONFIRMED]: '✅ Подтверждено',
      [BookingStatus.COMPLETED]: '📦 Завершено',
      [BookingStatus.CANCELLED]: '❌ Отменено'
    };
    return statusMap[status] || status;
  }
}
