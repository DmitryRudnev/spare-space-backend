import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async findWalletsByUser(userId: number): Promise<Wallet[]> {
    const wallets = await this.walletRepository.find({ where: { userId }});
    if (wallets.length !== 0) {
      return wallets;
    }
    
    // Если кошельков нет, создаем новый с нулевым балансом в рублях
    const wallet = this.walletRepository.create({ userId });
    await this.walletRepository.save(wallet);
    return [wallet];
  }

  async findTransactionsByUser(
    userId: number,
    limit: number,
    offset: number,
    type?: TransactionType,
  ): Promise<[Transaction[], number]> {
    const where: FindOptionsWhere<Transaction> = { userId };
    if (type) {
      where.type = type;
    }
    return this.transactionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // async topup(userId: number, dto: TopupDto): Promise<Transaction> {
  //   if (dto.amount <= 0) {
  //     throw new BadRequestException('Amount must be positive');
  //   }
  //   return this.dataSource.transaction(async (manager) => {
  //     const wallet = await this.getOrCreateWallet(userId);
  //     const balance = await this.getOrCreateBalance(wallet, dto.currency);
  //     balance.balance = +balance.balance + dto.amount;
  //     await manager.save(balance);

  //     const transaction = manager.create(Transaction, {
  //       wallet,
  //       type: TransactionType.TOPUP,
  //       amount: dto.amount,
  //       currency: dto.currency,
  //       status: PaymentStatus.COMPLETED,
  //       description: `Topup via ${dto.method}`,
  //       gatewayTransactionId: dto.gatewayTransactionId,
  //     });
  //     return manager.save(transaction);
  //   });
  // }

  // async withdraw(userId: number, dto: WithdrawDto): Promise<Transaction> {
  //   if (dto.amount <= 0) {
  //     throw new BadRequestException('Amount must be positive');
  //   }
  //   return this.dataSource.transaction(async (manager) => {
  //     const wallet = await this.getOrCreateWallet(userId);
  //     const balance = await this.getOrCreateBalance(wallet, dto.currency);
  //     if (+balance.balance < dto.amount) {
  //       throw new BadRequestException('Insufficient balance');
  //     }
  //     balance.balance = +balance.balance - dto.amount;
  //     await manager.save(balance);

  //     const transaction = manager.create(Transaction, {
  //       wallet,
  //       type: TransactionType.PAYOUT,
  //       amount: -dto.amount,
  //       currency: dto.currency,
  //       status: PaymentStatus.COMPLETED,
  //       description: `Withdraw to ${dto.destination}`,
  //     });
  //     return manager.save(transaction);
  //   });
  // }

  // async transfer(userId: number, dto: TransferDto): Promise<{ fromTransaction: Transaction; toTransaction: Transaction }> {
  //   await this.usersService.findById(dto.toUserId);

  //   return this.dataSource.transaction(async (manager) => {
  //     const fromWallet = await this.getOrCreateWallet(userId);
  //     const fromBalance = await this.getOrCreateBalance(fromWallet, dto.currency);
  //     if (+fromBalance.balance < dto.amount) {
  //       throw new BadRequestException('Insufficient balance');
  //     }
  //     fromBalance.balance = +fromBalance.balance - dto.amount;
  //     await manager.save(fromBalance);

  //     const toWallet = await this.getOrCreateWallet(dto.toUserId);
  //     const toBalance = await this.getOrCreateBalance(toWallet, dto.currency);
  //     toBalance.balance = +toBalance.balance + dto.amount;
  //     await manager.save(toBalance);

  //     const fromTransaction = manager.create(Transaction, {
  //       wallet: fromWallet,
  //       type: TransactionType.CHARGE,
  //       amount: -dto.amount,
  //       currency: dto.currency,
  //       status: PaymentStatus.COMPLETED,
  //       booking: undefined,
  //       description: dto.description || `Transfer to user ${dto.toUserId}`,
  //     });
  //     const toTransaction = manager.create(Transaction, {
  //       wallet: toWallet,
  //       type: TransactionType.TOPUP,
  //       amount: dto.amount,
  //       currency: dto.currency,
  //       status: PaymentStatus.COMPLETED,
  //       booking: undefined,
  //       description: dto.description || `Transfer from user ${userId}`,
  //     });

  //     await manager.save([fromTransaction, toTransaction]);
  //     return { fromTransaction, toTransaction };
  //   });
  // }
}
