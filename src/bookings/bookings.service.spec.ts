import { UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { BookingsService } from './bookings.service';
import { Booking } from '../entities/booking.entity';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/services/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';
import { BookingStatus } from '../common/enums/booking-status.enum';

describe('BookingsService (Integration)', () => {
  let service: BookingsService;
  let repo: any;
  let listingsService: jest.Mocked<ListingsService>;
  let usersService: jest.Mocked<UsersService>;

  const mockBooking = {
    id: 100,
    renter: { id: 1 },
    listing: { id: 50, user: { id: 2 }, title: 'Test Listing', availability: ['[2026-01-01,2026-12-31)'] },
    status: BookingStatus.PENDING,
    totalPrice: 1000,
    period: '[2026-06-01,2026-06-02)',
    periodDates: { start: new Date('2026-06-01'), end: new Date('2026-06-02') }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            create: jest.fn().mockReturnValue(mockBooking),
            save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
            findOne: jest.fn().mockResolvedValue(mockBooking),
            findAndCount: jest.fn().mockResolvedValue([[mockBooking], 1]),
            query: jest.fn().mockResolvedValue([{ contained: true }]),
            exists: jest.fn().mockResolvedValue(false),
            remove: jest.fn().mockResolvedValue(mockBooking),
          },
        },
        {
          provide: ListingsService,
          useValue: {
            findByIdWithCache: jest.fn(),
            updateAvailabilityAfterBooking: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UsersService,
          useValue: {
            hasRole: jest.fn(),
            findById: jest.fn().mockResolvedValue({ id: 1, firstName: 'Test', lastName: 'User' }),
          },
        },
        { provide: WalletsService, useValue: { processBookingPayment: jest.fn(), processRefund: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: getQueueToken('booking-completion'), useValue: { add: jest.fn() } },
        { provide: getQueueToken('booking-start'), useValue: { add: jest.fn().mockResolvedValue({ id: 'job_1' }) } },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    repo = module.get(getRepositoryToken(Booking));
    listingsService = module.get(ListingsService);
    usersService = module.get(UsersService);
  });

  describe('Utility Methods', () => {
    it('findById should return booking if exists', async () => {
      repo.findOne.mockResolvedValue(mockBooking);
      const result = await service.findById(100);
      expect(result.id).toBe(100);
    });

    it('findById should throw NotFoundException if booking not exists', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('findAll should return paginated result and apply filters', async () => {
      await service.findAll(1, { limit: 10, offset: 0, userRole: UserRoleType.RENTER, status: BookingStatus.PENDING });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ status: BookingStatus.PENDING, renter: { id: 1 } })
          ])
        })
      );
    });

    it('validateUserParticipation should pass for renter and landlord', async () => {
      repo.findOne.mockResolvedValue(mockBooking);
      await expect(service.validateUserParticipation(100, 1)).resolves.toBeUndefined(); // Renter
      await expect(service.validateUserParticipation(100, 2)).resolves.toBeUndefined(); // Landlord
    });

    it('validateUserParticipation should throw UnauthorizedException for non-participants', async () => {
      repo.findOne.mockResolvedValue(mockBooking);
      await expect(service.validateUserParticipation(100, 3)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Create Booking Logic', () => {
    const getFutureDates = (daysOffset = 1, duration = 1) => {
      const start = new Date(); start.setDate(start.getDate() + daysOffset);
      const end = new Date(start); end.setDate(end.getDate() + duration);
      return { start, end };
    };

    const createDto: any = {
      listingId: 50,
      pricePeriod: ListingPeriodType.DAY,
      period: getFutureDates(),
    };

    it('should successfully create a booking (Positive)', async () => {
      usersService.hasRole.mockResolvedValue(true);
      listingsService.findByIdWithCache.mockResolvedValue({
        id: 50,
        status: ListingStatus.ACTIVE,
        user: { id: 2 },
        pricings: [{ pricePeriod: ListingPeriodType.DAY, price: 1000 }],
        availability: ['[2026-01-01,2026-12-31)']
      } as any);

      const result = await service.create(1, createDto);
      expect(result.id).toBe(100);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if listing is inactive', async () => {
      listingsService.findByIdWithCache.mockResolvedValue({ status: ListingStatus.INACTIVE } as any);
      await expect(service.create(1, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is owner', async () => {
      listingsService.findByIdWithCache.mockResolvedValue({
        id: 50,
        status: ListingStatus.ACTIVE,
        user: { id: 1 }, 
      } as any);
      await expect(service.create(1, createDto)).rejects.toThrow('Cannot book owned listing');
    });

    it('should throw BadRequestException if dates are in the past', async () => {
      listingsService.findByIdWithCache.mockResolvedValue({ status: ListingStatus.ACTIVE, user: { id: 2 } } as any);
      const pastDto = { ...createDto, period: { start: new Date('2000-01-01'), end: new Date('2000-01-02') } };
      await expect(service.create(1, pastDto)).rejects.toThrow('Start date cannot be in the past');
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      listingsService.findByIdWithCache.mockResolvedValue({ status: ListingStatus.ACTIVE, user: { id: 2 } } as any);
      const invalidDates = getFutureDates();
      invalidDates.end.setDate(invalidDates.start.getDate() - 1);
      
      const invalidDto = { ...createDto, period: invalidDates };
      await expect(service.create(1, invalidDto)).rejects.toThrow('End date must be after start date');
    });

    it('should throw BadRequestException if period is outside availability', async () => {
      listingsService.findByIdWithCache.mockResolvedValue({ status: ListingStatus.ACTIVE, user: { id: 2 } } as any);
      repo.query.mockResolvedValueOnce([{ contained: false }]);
      await expect(service.create(1, createDto)).rejects.toThrow('completely within one of the listing');
    });

    it('should throw ConflictException if period overlaps with existing bookings', async () => {
      listingsService.findByIdWithCache.mockResolvedValue({ status: ListingStatus.ACTIVE, user: { id: 2 } } as any);
      repo.query.mockResolvedValueOnce([{ contained: true }]);
      repo.exists.mockResolvedValueOnce(true);
      await expect(service.create(1, createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if pricing is not supported', async () => {
      listingsService.findByIdWithCache.mockResolvedValue({ 
        status: ListingStatus.ACTIVE, user: { id: 2 }, pricings: [{ pricePeriod: ListingPeriodType.MONTH, price: 5000 }] 
      } as any);
      await expect(service.create(1, createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Update and Delete Logic', () => {
    it('updateStatus should successfully change status', async () => {
      repo.findOne.mockResolvedValue({ ...mockBooking });
      const result = await service.updateStatus(100, BookingStatus.ACTIVE);
      expect(result.status).toBe(BookingStatus.ACTIVE);
      expect(repo.save).toHaveBeenCalled();
    });

    it('delete should remove the booking record', async () => {
      await service.delete(mockBooking as any);
      expect(repo.remove).toHaveBeenCalledWith(mockBooking);
    });

    it('updatePeriod should recalculate price and save', async () => {
      repo.findOne.mockResolvedValue({ ...mockBooking, price: 1000, pricePeriod: ListingPeriodType.DAY });
      repo.query.mockResolvedValueOnce([{ contained: true }]);
      repo.exists.mockResolvedValueOnce(false);
      
      const start = new Date(); start.setDate(start.getDate() + 1);
      const end = new Date(start); end.setDate(end.getDate() + 5);

      await service.updatePeriod(100, { period: { start, end } });
      
      const savedBooking = repo.save.mock.calls[repo.save.mock.calls.length - 1][0];
      expect(savedBooking.totalPrice).toBe(5000); 
    });
  });
});