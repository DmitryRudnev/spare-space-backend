import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transaction-response.dto';

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto], description: 'Список транзакций' })
  transactions: TransactionResponseDto[];

  @ApiProperty({ type: Number, description: 'Общее количество транзакций', example: 50 })
  total: number;

  @ApiProperty({ type: Number, description: 'Лимит транзакций', example: 10 })
  limit: number;

  @ApiProperty({ type: Number, description: 'Смещение транзакций', example: 0 })
  offset: number;
}
