import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty({ example: 1, description: 'ID кошелька' })
  id: number;
  
  @ApiProperty({ type: Number, description: 'Баланс кошелька', example: 5000 })
  balance: number;

  @ApiProperty({ type: String, description: 'Дата создания кошелька', example: '2025-01-01T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ type: String, description: 'Дата последнего обновления кошелька', example: '2025-01-01T12:00:00.000Z' })
  updatedAt: string;
}
