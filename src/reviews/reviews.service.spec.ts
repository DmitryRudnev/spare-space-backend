import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from '../entities/review.entity';
import { BookingsService } from '../bookings/bookings.service';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/services/users.service';
import { RedisService } from '../common/redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '../common/enums/booking-status.enum';

describe('ReviewsService (Integration)', () => {
  let service: ReviewsService;
  let bookingsService: jest.Mocked<BookingsService>;
  let listingsService: jest.Mocked<ListingsService>;
  let usersService: jest.Mocked<UsersService>;
  let repo: any;

  const mockReview = {
    id: 1,
    rating: 5,
    text: 'Great',
    reviewer: { id: 1, firstName: 'A', lastName: 'B' },
    booking: { id: 10, listing: { id: 50, user: { id: 2 } } }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockReview),
            find: jest.fn().mockResolvedValue([{ rating: 5 }, { rating: 4 }]),
            findAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
            create: jest.fn().mockReturnValue(mockReview),
            save: jest.fn().mockResolvedValue(mockReview),
            count: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: BookingsService,
          useValue: {
            validateUserParticipation: jest.fn().mockResolvedValue(undefined),
            findById: jest.fn().mockResolvedValue({
              id: 10,
              status: BookingStatus.COMPLETED,
              listing: { id: 50, user: { id: 2 }, title: 'Listing' }
            }),
          },
        },
        {
          provide: ListingsService,
          useValue: {
            findByIdWithCache: jest.fn().mockResolvedValue({ id: 50, user: { id: 2 } }),
          },
        },
        { provide: UsersService, useValue: { update: jest.fn().mockResolvedValue(undefined) } },
        { provide: RedisService, useValue: { getOrSet: jest.fn(), deleteByPattern: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    bookingsService = module.get(BookingsService);
    listingsService = module.get(ListingsService);
    usersService = module.get(UsersService);
    repo = module.get(getRepositoryToken(Review));
  });

  describe('Search Methods', () => {
    it('findById should return a review', async () => {
      const result = await service.findById(1);
      expect(result.id).toBe(1);
    });

    it('findById should throw NotFoundException', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('findByListing should return list', async () => {
      const result = await service.findByListing(50, 10, 0);
      expect(result.reviews).toHaveLength(1);
    });
  });

  describe('Create Review Success', () => {
    it('should create review and update user rating', async () => {
      repo.findOne.mockResolvedValueOnce(null); // No existing review
      
      const result = await service.create(1, { bookingId: 10, rating: 5, text: 'Nice' });
      
      expect(result.id).toBe(1);
      expect(repo.save).toHaveBeenCalled();
      expect(usersService.update).toHaveBeenCalledWith(2, { rating: 4.5 }); // (5+4)/2 = 4.5
    });

    it('should throw if booking not completed', async () => {
      bookingsService.findById.mockResolvedValueOnce({ id: 10, status: BookingStatus.ACTIVE } as any);
      
      await expect(service.create(1, { bookingId: 10, rating: 5 }))
        .rejects.toThrow(BadRequestException);
    });
  });
});