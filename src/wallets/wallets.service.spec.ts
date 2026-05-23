import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { UsersService } from '../users/services/users.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';

describe('WalletsService (Integration)', () => {
  let service: WalletsService;
  let mockManager: any;
  let walletRepo: any;
  let transactionRepo: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((entityClass, data) => data),
      save: jest.fn().mockImplementation(async (data) => data),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn().mockImplementation((data) => data),
            save: jest.fn().mockImplementation(async (data) => data),
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            findAndCount: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn().mockImplementation(async (cb) => {
              // Имитируем вызов callback-функции транзакции с нашим mockManager
              return await cb(mockManager);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    walletRepo = module.get(getRepositoryToken(Wallet));
    transactionRepo = module.get(getRepositoryToken(Transaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findWalletByUser', () => {
    it('should return existing wallet', async () => {
      walletRepo.findOneBy.mockResolvedValue({ id: 1, userId: 2, balance: 100 });
      const result = await service.findWalletByUser(2);
      expect(result.balance).toBe(100);
      expect(walletRepo.findOneBy).toHaveBeenCalledWith({ userId: 2 });
    });

    it('should create and return new wallet if not exists', async () => {
      walletRepo.findOneBy.mockResolvedValue(null);
      const result = await service.findWalletByUser(2);
      expect(result.userId).toBe(2);
      expect(walletRepo.save).toHaveBeenCalled();
    });
  });

  describe('findTransactionsByUser', () => {
    it('should return paginated transactions', async () => {
      transactionRepo.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);
      const [transactions, total] = await service.findTransactionsByUser(1, 10, 0, TransactionType.DEPOSIT);
      expect(transactions).toHaveLength(1);
      expect(total).toBe(1);
      expect(transactionRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 1, type: TransactionType.DEPOSIT }
      }));
    });
  });

  describe('deposit and withdraw (Development)', () => {
    it('should successfully deposit funds', async () => {
      mockManager.findOne.mockResolvedValue({ id: 1, userId: 1, balance: 500 });
      const result = await service.deposit(1, 200);

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ balance: 700 }));
      expect(result.type).toBe(TransactionType.DEPOSIT);
      expect(result.amount).toBe(200);
    });

    it('should successfully withdraw funds', async () => {
      mockManager.findOne.mockResolvedValue({ id: 1, userId: 1, balance: 500 });
      const result = await service.withdraw(1, 200);

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ balance: 300 }));
      expect(result.type).toBe(TransactionType.WITHDRAWAL);
    });

    it('should throw BadRequestException on withdraw if insufficient balance', async () => {
      mockManager.findOne.mockResolvedValue({ id: 1, userId: 1, balance: 100 });
      await expect(service.withdraw(1, 500)).rejects.toThrow(BadRequestException);
      await expect(service.withdraw(1, 500)).rejects.toThrow('Insufficient balance');
    });
  });

  describe('Booking Finances', () => {
    it('should process booking payment (success)', async () => {
      mockManager.findOne.mockResolvedValue({ id: 1, userId: 1, balance: 1500 });
      const result = await service.processBookingPayment(1, 10, 500);

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ balance: 1000 }));
      expect(result.type).toBe(TransactionType.BOOKING_PAYMENT);
      expect(result.booking).toEqual({ id: 10 });
      expect(result.status).toBe(TransactionStatus.SUCCESS);
    });

    it('should throw BadRequestException on booking payment if insufficient funds', async () => {
      mockManager.findOne.mockResolvedValue({ id: 1, userId: 1, balance: 300 });
      await expect(service.processBookingPayment(1, 10, 500)).rejects.toThrow(BadRequestException);
      await expect(service.processBookingPayment(1, 10, 500)).rejects.toThrow('Insufficient funds for booking');
    });

    it('should process booking payout', async () => {
      mockManager.findOne.mockResolvedValue({ id: 2, userId: 2, balance: 0 });
      const result = await service.processBookingPayout(2, 10, 800);

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ balance: 800 }));
      expect(result.type).toBe(TransactionType.BOOKING_PAYOUT);
      expect(result.amount).toBe(800);
    });

    it('should process refund for cancelled booking', async () => {
      mockManager.findOne.mockResolvedValue({ id: 1, userId: 1, balance: 200 });
      const result = await service.processRefund(1, 10, 500);

      expect(mockManager.save).toHaveBeenCalledWith(expect.objectContaining({ balance: 700 }));
      expect(result.type).toBe(TransactionType.REFUND);
    });
  });
});
