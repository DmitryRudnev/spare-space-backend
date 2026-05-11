import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Max } from 'class-validator';

export class WalletOperationDto {
  @ApiProperty({ description: 'Сумма операции', example: 1500.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999999.99)
  amount: number;
}
