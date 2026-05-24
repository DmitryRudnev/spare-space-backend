import { Test, TestingModule } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Listing } from '../entities/listing.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { UsersService } from '../users/services/users.service';
import { RedisService } from '../common/redis/redis.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingType } from '../common/enums/listing-type.enum';
import { PaginatedListingsDto } from './dto/paginated-listings.dto';

describe('ListingsService (Integration)', () => {
  let service: ListingsService;
  let listingRepo: any;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let redisService: jest.Mocked<Partial<RedisService>>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockListing = {
    id: 1,
    title: 'Test Garage',
    status: ListingStatus.ACTIVE,
    user: { id: 2 },
    viewsCount: 0,
    availability: [],
    availabilityPeriodDates: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: getRepositoryToken(Listing),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockListing),
            create: jest.fn().mockReturnValue(mockListing),
            save: jest.fn().mockResolvedValue(mockListing),
            existsBy: jest.fn().mockResolvedValue(true),
            exists: jest.fn().mockResolvedValue(true),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            countBy: jest.fn().mockResolvedValue(5),
          },
        },
        {
          provide: getRepositoryToken(ViewHistory),
          useValue: {
            insert: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue({ id: 2 }),
            hasRole: jest.fn().mockResolvedValue(true),
            addRole: jest.fn().mockResolvedValue(undefined),
            validateExistence: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getOrSet: jest.fn().mockImplementation((key, ttl, cb) => cb()),
            deleteByPattern: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(ViewHistory),
          useValue: {
            insert: jest.fn().mockResolvedValue(undefined),
            existsBy: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    listingRepo = module.get(getRepositoryToken(Listing));
    usersService = module.get(UsersService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById & Caching', () => {
    it('should return a listing', async () => {
      const result = await service.findById(1);
      expect(result.title).toBe('Test Garage');
    });

    it('should throw NotFoundException if not exists', async () => {
      listingRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('findByIdWithCache should use redisService.getOrSet', async () => {
      await service.findByIdWithCache(1);
      expect(redisService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should successfully create a listing and invalidate cache', async () => {
      const dto: any = { type: ListingType.GARAGE, title: 'New Garage' };
      const result = await service.create(2, dto);
      
      expect(result).toBeDefined();
      expect(listingRepo.create).toHaveBeenCalled();
      expect(listingRepo.save).toHaveBeenCalled();
      expect(redisService.deleteByPattern).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update status and invalidate cache', async () => {
      await service.updateStatus(1, ListingStatus.INACTIVE);
      
      expect(listingRepo.save).toHaveBeenCalled();
      expect(redisService.delete).toHaveBeenCalledWith('listing:1');
    });

    it('should not update if status is the same', async () => {
      // Изолируем тест от мутаций: возвращаем свежий объект со статусом ACTIVE
      listingRepo.findOne.mockResolvedValueOnce({
        id: 1,
        status: ListingStatus.ACTIVE,
        user: { id: 2 },
      });

      await service.updateStatus(1, ListingStatus.ACTIVE);
      expect(listingRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('validateListingOwnership', () => {
    it('should throw UnauthorizedException if user is not the owner', async () => {
      listingRepo.exists.mockResolvedValueOnce(false);
      await expect(service.validateListingOwnership(1, 99)).rejects.toThrow(UnauthorizedException);
    });

    it('should pass if user is owner', async () => {
      listingRepo.exists.mockResolvedValueOnce(true);
      await expect(service.validateListingOwnership(1, 2)).resolves.toBeUndefined();
    });
  });

  describe('Search Methods', () => {
    it('findAll should build query and return data', async () => {
      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result.limit).toBe(10);
    });

    it('findGeo should select specific fields', async () => {
      await service.findGeo({ limit: 10, offset: 0 });
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });
  });

  describe('updateViewHistory', () => {
    it('should increment viewsCount and insert history record', async () => {
      await service.updateViewHistory(1, 2);
      expect(listingRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAllWithCache', () => {
    it('should use cache for user active listings (no extra filters)', async () => {
      const dto = { limit: 10, offset: 0, status: ListingStatus.ACTIVE } as any;
      await service.findAllWithCache(dto, 2);
      expect(redisService.getOrSet).toHaveBeenCalledWith(
        'user:2:listings:active:limit:10:offset:0',
        expect.any(Number),
        expect.any(Function),
        PaginatedListingsDto
      );
    });

    it('should use cache for type listings (only type filter)', async () => {
      const dto = { limit: 10, offset: 0, status: ListingStatus.ACTIVE, type: ListingType.PARKING } as any;
      await service.findAllWithCache(dto); // без userId
      expect(redisService.getOrSet).toHaveBeenCalledWith(
        'listings:PARKING:limit:10:offset:0',
        expect.any(Number),
        expect.any(Function),
        PaginatedListingsDto
      );
    });

    it('should bypass cache for complex filters', async () => {
      const dto = { limit: 10, offset: 0, status: ListingStatus.ACTIVE, minPrice: 100 } as any;
      await service.findAllWithCache(dto, 2);
      
      // getOrSet не должен быть вызван, так как фильтры сложные
      expect(redisService.getOrSet).not.toHaveBeenCalled();
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update listing, invalidate caches and save', async () => {
      const dto: any = { title: 'Updated Garage', size: 20 };
      listingRepo.findOne.mockResolvedValueOnce(mockListing); // для findByIdWithCache
      listingRepo.create.mockReturnValueOnce({ ...mockListing, ...dto });
      
      await service.update(1, dto);

      expect(redisService.delete).toHaveBeenCalledWith('listing:1');
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('user:2:listings:active:*');
      expect(listingRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateAvailabilityAfterBooking', () => {
    it('should throw if no availability periods exist', async () => {
      listingRepo.findOne.mockResolvedValueOnce({ ...mockListing, availabilityPeriodDates: [] });
      await expect(
        service.updateAvailabilityAfterBooking(1, new Date(), new Date())
      ).rejects.toThrow('Listing has no availability periods');
    });

    it('should throw if booking period is not contained in any slot', async () => {
      const period = { start: new Date('2025-01-01'), end: new Date('2025-01-10') };
      listingRepo.findOne.mockResolvedValueOnce({ ...mockListing, availabilityPeriodDates: [period] });
      await expect(
        service.updateAvailabilityAfterBooking(1, new Date('2025-01-05'), new Date('2025-01-15'))
      ).rejects.toThrow('Booking period is not contained in any availability slot');
    });

    it('should successfully split containing period and invalidate caches', async () => {
      const period = { start: new Date('2025-01-01T00:00:00Z'), end: new Date('2025-01-10T00:00:00Z') };
      const listing = { ...mockListing, availabilityPeriodDates: [period], availability: [] };
      listingRepo.findOne.mockResolvedValueOnce(listing);

      const bookStart = new Date('2025-01-04T00:00:00Z');
      const bookEnd = new Date('2025-01-06T00:00:00Z');

      await service.updateAvailabilityAfterBooking(1, bookStart, bookEnd);

      expect(listing.availability).toHaveLength(2);
      expect(listing.availability[0]).toBe('[2025-01-01T00:00:00.000Z,2025-01-04T00:00:00.000Z)');
      expect(listing.availability[1]).toBe('[2025-01-06T00:00:00.000Z,2025-01-10T00:00:00.000Z)');
      
      expect(listingRepo.save).toHaveBeenCalledWith(listing);
      expect(redisService.delete).toHaveBeenCalledWith('listing:1');
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('user:2:listings:active:*');
    });
  });

  describe('Utility Methods (exists, validateExistence, countByUser)', () => {
    it('exists should return boolean flag', async () => {
      listingRepo.existsBy.mockResolvedValueOnce(true);
      const result = await service.exists(1);
      expect(result).toBe(true);
      expect(listingRepo.existsBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('validateExistence should pass if listing exists', async () => {
      jest.spyOn(service, 'exists').mockResolvedValueOnce(true);
      await expect(service.validateExistence(1)).resolves.toBeUndefined();
    });

    it('validateExistence should throw NotFoundException if listing does not exist', async () => {
      jest.spyOn(service, 'exists').mockResolvedValueOnce(false);
      await expect(service.validateExistence(1)).rejects.toThrow(NotFoundException);
    });

    it('countByUser should return counts considering statuses', async () => {
      listingRepo.countBy.mockResolvedValueOnce(5);
      const result = await service.countByUser(2, [ListingStatus.ACTIVE]);
      
      expect(result).toBe(5);
      expect(listingRepo.countBy).toHaveBeenCalledWith({
        user: { id: 2 },
        status: expect.anything(), // Проверяем наличие ключа статуса (In оператор)
      });
    });
  });
});
