import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class SearchTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TransactionType, description: 'Тип транзакции для фильтрации', example: TransactionType.WITHDRAWAL })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
