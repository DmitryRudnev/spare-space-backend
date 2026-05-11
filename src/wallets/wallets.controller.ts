import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WalletOperationDto } from './dto/requests/wallet-operation.dto';
import { TransactionResponseDto } from './dto/responses/transaction-response.dto';

import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { SearchTransactionsDto } from './dto/requests/search-transactions.dto';
import { WalletResponseDto } from './dto/responses/wallet-response.dto';
import { TransactionListResponseDto } from './dto/responses/transaction-list-response.dto';
import { WalletMapper } from './mappers/wallet.mapper';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiTags('Wallets')
@ApiBearerAuth()
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('balance/my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить баланс кошелька пользователя' })
  @ApiOkResponse({ type: WalletResponseDto, description: 'Баланс кошелька пользователя' })
  async findWalletsByUser(@User('userId') userId: number): Promise<WalletResponseDto> {
    const wallet = await this.walletsService.findWalletByUser(userId);
    return WalletMapper.toWalletResponseDto(wallet);
  }
  
  @Get('transactions/my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить список транзакций пользователя' })
  @ApiOkResponse({ type: TransactionListResponseDto, description: 'Список транзакций пользователя' })
  async findTransactionsByUser(
    @User('userId') userId: number,
    @Query() dto: SearchTransactionsDto
  ): Promise<TransactionListResponseDto> {
    const [transactions, total] = await this.walletsService.findTransactionsByUser(
      userId,
      dto.limit,
      dto.offset,
      dto.type
    );
    return WalletMapper.toTransactionListDto(transactions, total, dto.limit, dto.offset);
  }

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Пополнить баланс кошелька (dev)' })
  @ApiOkResponse({ type: TransactionResponseDto, description: 'Транзакция пополнения' })
  async deposit(
    @User('userId') userId: number,
    @Body() dto: WalletOperationDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.walletsService.deposit(userId, dto.amount);
    return WalletMapper.toTransactionResponseDto(transaction);
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Вывести средства с кошелька (dev)' })
  @ApiOkResponse({ type: TransactionResponseDto, description: 'Транзакция вывода' })
  async withdraw(
    @User('userId') userId: number,
    @Body() dto: WalletOperationDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.walletsService.withdraw(userId, dto.amount);
    return WalletMapper.toTransactionResponseDto(transaction);
  }
}
