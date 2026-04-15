import { Wallet } from '../../entities/wallet.entity';
import { Transaction } from '../../entities/transaction.entity';
import { WalletResponseDto } from '../dto/responses/wallet-response.dto';
import { TransactionResponseDto } from '../dto/responses/transaction-response.dto';
import { TransactionListResponseDto } from '../dto/responses/transaction-list-response.dto';

export class WalletMapper {
  static toWalletResponseDto(wallet: Wallet): WalletResponseDto {
    const dto = new WalletResponseDto();

    dto.id = wallet.id;
    dto.balance = wallet.formattedBalance;
    dto.currency = wallet.currency;
    dto.createdAt = wallet.createdAt.toISOString();
    dto.updatedAt = wallet.updatedAt.toISOString();

    return dto;
  }

  static toTransactionResponseDto(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();

    dto.id = transaction.id;
    dto.type = transaction.type;
    dto.amount = transaction.formattedAmount;
    dto.currency = transaction.currency;
    dto.status = transaction.status;
    dto.commission = transaction.commission;
    dto.description = transaction.description;
    dto.gatewayTransactionId = transaction.gatewayTransactionId;
    dto.createdAt = transaction.createdAt.toISOString();

    return dto;
  }

  static toTransactionListDto(
    transactions: Transaction[],
    total: number,
    limit: number,
    offset: number,
  ): TransactionListResponseDto {
    const dto = new TransactionListResponseDto();

    dto.transactions = transactions.map((t) => this.toTransactionResponseDto(t));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
}
