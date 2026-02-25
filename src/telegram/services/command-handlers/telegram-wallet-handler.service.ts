import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/services/users.service';
import { WalletsService } from '../../../wallets/wallets.service';
import { TelegramSenderService } from '../telegram-sender.service';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { WalletBalance } from '../../../entities/wallet-balance.entity';
import { Transaction } from '../../../entities/transaction.entity';
import { CurrencyType } from 'src/common/enums/currency-type.enum';

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
      const balances = await this.walletsService.getBalances(userId, {});
      const transactions = await this.walletsService.findTransactionsByUserId(userId);

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


  private buildWalletMessage(balances: WalletBalance[], transactions: Transaction[]): string {
    let message = `💰 *Ваш кошелёк*\n\n`;

    // Секция балансов
    if (balances.length === 0) {
      message += `📭 *Баланс:* отсутсвует\n\n`;
    } else {
      message += `📊 *Баланс:*\n`;
      balances.forEach(balance => {
        const formattedBalance = this.isFiat(balance.currency) ? 
          Number(balance.balance).toFixed(2) : balance.balance;
        message += `• ${formattedBalance} ${balance.currency}\n`;
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
        const sign = transaction.type === TransactionType.TOPUP ? '+' : '-';
        const amount = this.isFiat(transaction.currency) ? 
          Number(transaction.amount).toFixed(2) : 
          transaction.amount;
        
        message += `${index + 1}. ${emoji} ${typeText}: ${sign}${amount} ${transaction.currency}\n`;
        if (transaction.description) {
          message += ` - ${transaction.description}`;
        }
        message += `\n   🗓 ${new Date(transaction.createdAt).toLocaleString('ru-RU')}\n\n`;
      });
    }

    return message;
  }


  private isFiat(currency: CurrencyType): boolean {
    return currency === CurrencyType.RUB || currency === CurrencyType.USD;
  }


  private getTransactionEmoji(type: TransactionType): string {
    const emojiMap = {
      [TransactionType.TOPUP]: '🟢',
      [TransactionType.CHARGE]: '🔴',
      [TransactionType.PAYOUT]: '🟠',
    //   [TransactionType.REFUND]: '🟡',
    };
    return emojiMap[type] || '⚪';
  }


  private getTypeText(type: TransactionType): string {
    const typeMap = {
      [TransactionType.TOPUP]: 'Пополнение',
      [TransactionType.CHARGE]: 'Списание',
      [TransactionType.PAYOUT]: 'Вывод',
      [TransactionType.COMMISSION]: 'Комиссия',
    //   [TransactionType.REFUND]: 'Возврат',
    };
    return typeMap[type] || type;
  }
}
