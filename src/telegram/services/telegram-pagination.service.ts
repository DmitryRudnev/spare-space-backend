// D:\spare-space-backend\src\telegram\services\telegram-pagination.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/types';
import { PaginationCallbackData } from '../dto/callback-data.dto';

@Injectable()
export class TelegramPaginationService {
  constructor(private readonly configService: ConfigService) {}

  getItemsPerPage(): number {
    return this.configService.get<number>('telegram.pagination.itemsPerPage', 5);
  }

  createPaginationKeyboard(
    currentPage: number, 
    totalPages: number,
    entity: string,
    extra?: string
  ): Markup.Markup<InlineKeyboardMarkup> {

    // Кнопка "Назад" - если первая страница, то делаем "noop"
    const prevPage = Math.max(1, currentPage - 1);
    const prevCallback = currentPage === 1 
      ? 'noop' // Пустой callback для неактивной кнопки
      : new PaginationCallbackData(entity, 'page', prevPage, extra).toString();
    
    // Кнопка "Вперёд" - если последняя страница, то делаем "noop"
    const nextPage = Math.min(totalPages, currentPage + 1);
    const nextCallback = currentPage === totalPages
      ? 'noop'
      : new PaginationCallbackData(entity, 'page', nextPage, extra).toString();
    
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(
          currentPage === 1 ? ' ' : '◀️',
          prevCallback
        ),
        Markup.button.callback(`${currentPage}/${totalPages}`, 'noop'),
        Markup.button.callback(
          currentPage === totalPages ? ' ' : '▶️',
          nextCallback
        )
      ]
    ]);
  }

  calculateTotalPages(totalItems: number): number {
    const itemsPerPage = this.getItemsPerPage();
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }

  /**
   * Проверяет, может ли пользователь перейти на запрашиваемую страницу
   */
  validatePageRequest(requestedPage: number, totalPages: number): { valid: boolean; message?: string } {
    if (requestedPage < 1) {
      return { valid: false, message: '⚠️ Вы уже на первой странице' };
    }
    
    if (requestedPage > totalPages) {
      return { valid: false, message: '⚠️ Вы уже на последней странице' };
    }
    
    return { valid: true };
  }
}
