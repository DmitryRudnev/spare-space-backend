import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { WalletsService } from '../../../wallets/wallets.service';
import { TelegramSenderService } from '../telegram-sender.service';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { Wallet } from '../../../entities/wallet.entity';
import { Transaction } from '../../../entities/transaction.entity';

@Injectable()
export class TelegramWalletHandlerService {
  private readonly logger = new Logger(TelegramWalletHandlerService.name);
  constructor(
    private readonly telegramSenderService: TelegramSenderService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
  ) {}

  
  async handle(chatId: number, userId: number): Promise<void> {
    try {
      const balances = await this.walletsService.findWalletsByUser(userId);
      const [transactions, total] = await this.walletsService.findTransactionsByUser(userId, 5, 0);

      const message = this.buildWalletMessage(balances, transactions);
      await this.telegramSenderService.sendMessage(chatId, message);
    } catch (error) {
      this.logger.error(`Ошибка получения кошелька: ${error.message}`);
      await this.telegramSenderService.sendMessage(chatId, '❌ Не удалось загрузить информацию о кошельке');
    }
  }


  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================


  private buildWalletMessage(balances: Wallet[], transactions: Transaction[]): string {
    let message = `💰 *Ваш кошелёк*\n\n`;

    // Секция балансов
    if (balances.length === 0) {
      message += `📭 *Баланс:* отсутсвует\n\n`;
    } else {
      message += `📊 *Баланс:*\n`;
      balances.forEach(balance => {
        message += `• ${balance.balance} ₽\n`;
      });
      message += `\n`;
    }

    // Секция последних транзакций
    if (transactions.length === 0) {
      message += `📭 *Последние операции:* нет транзакций`;
    } else {
      message += `💳 *Последние операции:*\n`;
      transactions.forEach((transaction, index) => {
        const emoji = this.getTransactionEmoji(transaction.type);
        const typeText = this.getTypeText(transaction.type);
        const sign = transaction.type === TransactionType.DEPOSIT ||  transaction.type === TransactionType.BOOKING_PAYOUT
          ? '+'
          : '-'
        ;
        message += `${index + 1}. ${emoji} ${typeText}: ${sign}${transaction.amount} ₽\n`;
        if (transaction.description) {
          message += ` - ${transaction.description}`;
        }
        message += `\n   🗓 ${new Date(transaction.createdAt).toLocaleString('ru-RU')}\n\n`;
      });
    }

    return message;
  }


  private getTransactionEmoji(type: TransactionType): string {
    const emojiMap = {
      [TransactionType.DEPOSIT]: '🟢',
      [TransactionType.BOOKING_PAYOUT]: '🟢',
      [TransactionType.WITHDRAWAL]: '🔴',
      [TransactionType.BOOKING_PAYMENT]: '🔴',
      [TransactionType.COMMISSION]: '🟡',
    };
    return emojiMap[type] || '⚪';
  }


  private getTypeText(type: TransactionType): string {
    const typeMap = {
      [TransactionType.DEPOSIT]: 'Зачисление из банка',
      [TransactionType.BOOKING_PAYOUT]: 'Зачисление за завершённую аренду',
      [TransactionType.WITHDRAWAL]: 'Вывод в банк',
      [TransactionType.BOOKING_PAYMENT]: 'Оплата бронирования',
      [TransactionType.COMMISSION]: 'Комиссия',
    };
    return typeMap[type] || type;
  }
}
