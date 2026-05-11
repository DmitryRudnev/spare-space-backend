import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, EntityManager } from 'typeorm';

import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async findWalletByUser(userId: number): Promise<Wallet> {
    const wallet = await this.walletRepository.findOneBy({ userId });
    if (wallet) {
      return wallet;
    }
    
    // Если кошелька нет, создаем новый
    const newWallet = this.walletRepository.create({ userId });
    await this.walletRepository.save(newWallet);
    return newWallet;
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

  async deposit(userId: number, amount: number): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getLockedWallet(manager, userId);
      
      wallet.balance = Number(wallet.balance) + amount;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.DEPOSIT,
        amount,
        status: TransactionStatus.SUCCESS,
        description: 'Development deposit',
      });
      return manager.save(transaction);
    });
  }

  async withdraw(userId: number, amount: number): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getLockedWallet(manager, userId);
      
      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      wallet.balance = Number(wallet.balance) - amount;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        userId,
        type: TransactionType.WITHDRAWAL,
        amount,
        status: TransactionStatus.SUCCESS,
        description: 'Development withdrawal',
      });
      return manager.save(transaction);
    });
  }

  async processBookingPayment(userId: number, bookingId: number, amount: number): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getLockedWallet(manager, userId);

      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient funds for booking');
      }

      wallet.balance = Number(wallet.balance) - amount;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        userId,
        booking: { id: bookingId } as any,
        type: TransactionType.BOOKING_PAYMENT,
        amount,
        status: TransactionStatus.SUCCESS,
        description: `Payment for booking #${bookingId}`,
      });

      return manager.save(transaction);
    });
  }

  async processBookingPayout(userId: number, bookingId: number, amount: number): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getLockedWallet(manager, userId);

      wallet.balance = Number(wallet.balance) + amount;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        userId,
        booking: { id: bookingId } as any,
        type: TransactionType.BOOKING_PAYOUT,
        amount,
        status: TransactionStatus.SUCCESS,
        description: `Payout for booking #${bookingId}`,
      });

      return manager.save(transaction);
    });
  }

  async processRefund(userId: number, bookingId: number, amount: number): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getLockedWallet(manager, userId);

      wallet.balance = Number(wallet.balance) + amount;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        userId,
        booking: { id: bookingId } as any,
        type: TransactionType.REFUND,
        amount,
        status: TransactionStatus.SUCCESS,
        description: `Refund for cancelled/rejected booking #${bookingId}`,
      });

      return manager.save(transaction);
    });
  }

  private async getLockedWallet(manager: EntityManager, userId: number): Promise<Wallet> {
    let wallet = await manager.findOne(Wallet, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      wallet = manager.create(Wallet, { userId, balance: 0 });
      await manager.save(wallet);
    }

    return wallet;
  }
}
