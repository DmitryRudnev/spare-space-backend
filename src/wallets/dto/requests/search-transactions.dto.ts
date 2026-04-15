import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { CurrencyType } from '../../../common/enums/currency-type.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class SearchTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CurrencyType, description: 'Валюта транзакции для фильтрации', example: CurrencyType.RUB })
  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;
  
  @ApiPropertyOptional({ enum: TransactionType, description: 'Тип транзакции для фильтрации', example: TransactionType.TOPUP })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
