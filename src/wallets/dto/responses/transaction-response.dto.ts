import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class TransactionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: TransactionType, description: 'Тип транзакции', example: TransactionType.TOPUP })
  type: TransactionType;

  @ApiProperty({ type: Number, description: 'Сумма транзакции', example: 100.0 })
  amount: number;

  @ApiProperty({ enum: CurrencyType, description: 'Валюта транзакции', example: CurrencyType.RUB })
  currency: CurrencyType;

  @ApiProperty({ enum: PaymentStatus, description: 'Статус транзакции', example: PaymentStatus.COMPLETED })
  status: PaymentStatus;

  @ApiProperty({ type: Number, description: 'Комиссия за транзакцию', example: 10.0 })
  commission: number;

  @ApiProperty({ type: String, description: 'Описание транзакции', example: 'Пополнение через Stripe', nullable: true })
  description: string | null;

  @ApiProperty({ type: String, description: 'ID транзакции в платежной системе', example: 'txn_1234567890abcdef', nullable: true })
  gatewayTransactionId: string | null;

  @ApiProperty({ type: String, description: 'Дата создания транзакции', example: '2025-01-01T12:00:00.000Z' })
  createdAt: string;
}
