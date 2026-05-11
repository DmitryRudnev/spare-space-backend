import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { TransactionStatus } from '../../../common/enums/transaction-status.enum';

export class TransactionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: TransactionType, description: 'Тип транзакции', example: TransactionType.DEPOSIT })
  type: TransactionType;

  @ApiProperty({ type: Number, description: 'Сумма транзакции', example: 100.0 })
  amount: number;

  @ApiProperty({ enum: TransactionStatus, description: 'Статус транзакции', example: TransactionStatus.SUCCESS })
  status: TransactionStatus;

  @ApiProperty({ type: String, description: 'Описание транзакции', example: 'Пополнение через Stripe', nullable: true })
  description: string | null;

  @ApiProperty({ type: String, description: 'ID транзакции в платежной системе', example: 'txn_1234567890abcdef', nullable: true })
  gatewayTransactionId: string | null;

  @ApiProperty({ type: String, description: 'Дата создания транзакции', example: '2025-01-01T12:00:00.000Z' })
  createdAt: string;
}
