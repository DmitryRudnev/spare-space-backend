import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, FindOptionsWhere } from 'typeorm';
import type { Point } from 'geojson';

import { UsersService } from '../users/services/users.service';
import { Listing } from '../entities/listing.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingType } from '../common/enums/listing-type.enum';
import { RedisService } from '../common/redis/redis.service';

import { CreateListingDto } from './dto/requests/create-listing.dto';
import { UpdateListingDto } from './dto/requests/update-listing.dto';
import { SearchListingsDto } from './dto/requests/search-listings.dto';
import { PaginatedListingsDto } from './dto/paginated-listings.dto';

@Injectable()
export class ListingsService {
  private readonly LISTING_CACHE_TTL_SEC = 3600; // 1 час
  private readonly USER_LISTINGS_CACHE_TTL_SEC = 3600; // 1 час
  private readonly LISTINGS_LIST_CACHE_TTL_SEC = 900; // 15 мин

  constructor(
    @InjectRepository(Listing) private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ViewHistory) private readonly viewHistoryRepository: Repository<ViewHistory>,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  // ==========================================================================
  // ================================= REDIS ==================================
  // ==========================================================================

  private getListingCacheKey(listingId: number): string {
    return `listing:${listingId}`;
  }

  private getTypeListingsCacheKey(type: ListingType, limit: number, offset: number): string {
    return `listings:${type}:limit:${limit}:offset:${offset}`;
  }

  private getUserActiveListingsCacheKey(userId: number, limit: number, offset: number): string {
    return `user:${userId}:listings:active:limit:${limit}:offset:${offset}`;
  }

  private getUserActiveListingsPattern(userId: number): string {
    return `user:${userId}:listings:active:*`;
  }

  async findAllWithCache(
    searchDto: SearchListingsDto,
    userId?: number,
  ): Promise<PaginatedListingsDto> {
    if (userId !== undefined) {
      await this.usersService.validateExistence(userId);
    }

    // Кэш для активных объявлений конкретного пользователя (без фильтров)
    if (this.canCacheUserActiveListings(userId, searchDto)) {
      return this.redisService.getOrSet(
        this.getUserActiveListingsCacheKey(userId!, searchDto.limit, searchDto.offset),
        this.USER_LISTINGS_CACHE_TTL_SEC,
        () => this.findAll(searchDto, userId),
        PaginatedListingsDto
      );
    }

    // Кэш для активных объявлений с единственным фильтром - типом
    if (this.canCacheTypeListings(userId, searchDto)) {
      return this.redisService.getOrSet(
        this.getTypeListingsCacheKey(searchDto.type!, searchDto.limit, searchDto.offset),
        this.LISTINGS_LIST_CACHE_TTL_SEC,
        () => this.findAll(searchDto, userId),
        PaginatedListingsDto
      );
    }

    // Обычный запрос без кэширования
    return this.findAll(searchDto, userId);
  }

  async findByIdWithCache(listingId: number): Promise<Listing> {
    return this.redisService.getOrSet(
      this.getListingCacheKey(listingId),
      this.LISTING_CACHE_TTL_SEC,
      () => this.findById(listingId),
      Listing
    );
  }

  // ==========================================================================
  // =============================== PUBLIC API ===============================
  // ==========================================================================

  async findAll(
    searchDto: SearchListingsDto,
    userId?: number,
  ): Promise<PaginatedListingsDto> {
    const [listings, total] = await this.buildSearchQuery(searchDto, userId).getManyAndCount();
    return { listings, total, limit: searchDto.limit, offset: searchDto.offset };
  }

  async findById(listingId: number): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: { user: true, pricings: true },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async findGeo(
    searchDto: SearchListingsDto,
    userId?: number,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    const query = this.buildSearchQuery(searchDto, userId);
    query.andWhere('listing.location IS NOT NULL');
    query.select([
      'listing.id',
      'listing.title',
      'listing.type',
      'listing.size',
      'listing.location',
      'listing.photoUrls',
      'pricing.id',
      'pricing.price',
      'pricing.pricePeriod',
    ]);
    const [listings, total] = await query.getManyAndCount();
    return { listings, total, limit: searchDto.limit, offset: searchDto.offset };
  }

  async create(userId: number, createDto: CreateListingDto): Promise<Listing> {
    const user = await this.usersService.findById(userId);
    const listingData = this.prepareListingData(createDto, { user, status: ListingStatus.ACTIVE });  // пока что для разработки статус ACTIVE; потом сделать DRAFT
    const listing = this.listingRepository.create(listingData);

    // Инвалидируем кэш списка активных объявлений пользователя
    await this.redisService.deleteByPattern(this.getUserActiveListingsPattern(userId));  // удалить, когда при создании объявления будут иметь статуст DRAFT, а не ACTIVE, как это сейчас

    return this.listingRepository.save(listing);
  }

  async update(listingId: number, updateDto: UpdateListingDto): Promise<Listing> {
    const listing = await this.findByIdWithCache(listingId);
    const updatedData = this.prepareListingData(updateDto, listing);
    const updatedListing = this.listingRepository.create(updatedData);

    // Инвалидация конкретного объявления
    await this.redisService.delete(this.getListingCacheKey(listingId));
    // Инвалидация списка объявлений пользователя
    await this.redisService.deleteByPattern(this.getUserActiveListingsPattern(listing.user.id));

    return this.listingRepository.save(updatedListing);
  }

  async updateStatus(listingId: number, newStatus: ListingStatus): Promise<void> {
    const listing = await this.findByIdWithCache(listingId);
    const prevStatus = listing.status;
    if (prevStatus === newStatus) {
      return;
    }

    listing.status = newStatus;
    await this.listingRepository.save(listing);

    // Инвалидация конкретного объявления
    await this.redisService.delete(this.getListingCacheKey(listingId));
    // Инвалидация списка объявлений пользователя
    if (prevStatus === ListingStatus.ACTIVE || newStatus === ListingStatus.ACTIVE) {
      await this.redisService.deleteByPattern(this.getUserActiveListingsPattern(listing.user.id));
    }
  }

  // Неправильный подход. Временно. listing.availability менять нельзя. Настоящие периоды
  // доступности объекта должны вычисляться на сервере исходя из listing.availability и всех
  // бронирований со статусами PENDING/CONFIRMED/ACTIVE по этому объявлению - то есть надо будет
  // аналогично(примерно) применить алгоритм, опсианный ниже, для вычета всех периодов бронирований
  // из периодов listing.availability.
  // В общем в ListingDetailResponseDto поле availability должно быть как раз вот этими
  // "настоящими" периодами доступности.
  async updateAvailabilityAfterBooking(
    listingId: number,
    bookingStart: Date,
    bookingEnd: Date,
  ): Promise<void> {
    const listing = await this.findById(listingId);

    // Получить периоды доступности
    const availabilityDates = listing.availabilityPeriodDates;
    if (availabilityDates.length === 0) {
      throw new Error('Listing has no availability periods');
    }

    // Найти содержащий период
    let containingIndex = availabilityDates.findIndex(period => 
      bookingStart >= period.start && bookingEnd <= period.end
    );
    if (containingIndex === -1) {
      throw new Error('Booking period is not contained in any availability slot');
    }

    const containingPeriod = availabilityDates[containingIndex];
    const newPeriods: {start: Date, end: Date}[] = [...availabilityDates];

    // Разделить содержащий период
    const beforeFragment = { start: containingPeriod.start, end: bookingStart };
    const afterFragment = { start: bookingEnd, end: containingPeriod.end };

    // Заменить содержащий период на фрагменты (пропустить пустые)
    newPeriods.splice(containingIndex, 1);
    if (beforeFragment.end > beforeFragment.start) {
      newPeriods.splice(containingIndex, 0, beforeFragment);
      containingIndex++; // Корректировка для вставленного "до"
    }
    if (afterFragment.end > afterFragment.start) {
      newPeriods.splice(containingIndex, 0, afterFragment);
    }

    // Конвертировать обратно в строки
    listing.availability = newPeriods.map(p => `[${p.start.toISOString()},${p.end.toISOString()})`);

    await this.listingRepository.save(listing);

    // Инвалидировать кэши 
    await this.redisService.delete(this.getListingCacheKey(listingId));
    await this.redisService.deleteByPattern(this.getUserActiveListingsPattern(listing.user.id));
  }

  async countByUser(
    userId: number,
    statuses?: ListingStatus[],
  ): Promise<number> {
    const where: FindOptionsWhere<Listing> = {
      user: { id: userId }
    };
    if (statuses !== undefined) {
      where.status = In(statuses);
    }
    return await this.listingRepository.countBy(where);
  }

  async exists(listingId: number): Promise<boolean> {
    return this.listingRepository.existsBy({ id: listingId });
  }
  
  async validateExistence(listingId: number): Promise<void> {
    if (! await this.exists(listingId)) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
  }

  async validateListingOwnership(listingId: number, userId: number): Promise<void> {
    const exists = await this.listingRepository.exists({ where: {
      id: listingId,
      user: { id: userId },
    }});
    if (!exists) {
      throw new UnauthorizedException('Not authorized to modify this listing');
    }
  }

  async updateViewHistory(listingId: number, userId: number): Promise<void> {
    await this.usersService.validateExistence(userId);
    const listing = await this.findByIdWithCache(listingId);
    listing.viewsCount += 1;
    await this.listingRepository.save(listing);

    await this.viewHistoryRepository.insert({ 
      user: { id: userId }, 
      listing: { id: listingId }, 
    });
  }

  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================

  private prepareListingData(
    dto: CreateListingDto | UpdateListingDto,
    baseData: Partial<Listing> | Listing
  ): Partial<Listing> {
    const data: Partial<Listing> = { ...baseData };

    if (dto.type !== undefined) data.type = dto.type;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.pricings !== undefined) {
      const periods = dto.pricings.map(p => p.pricePeriod);
      if (new Set(periods).size !== periods.length) {
        throw new BadRequestException('Price periods cannot be dublicated');
      }
      data.pricings = dto.pricings as any; // TypeORM сам замапит массив объектов в сущности из-за cascade: true
    }
    
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.size !== undefined) data.size = dto.size;
    if (dto.photoUrls !== undefined) data.photoUrls = dto.photoUrls;
    if (dto.location !== undefined) {
      data.location = {
        type: 'Point' as const,
        coordinates: [dto.location.longitude, dto.location.latitude] as [number, number],
      } as Point;
    }
    if (dto.amenities !== undefined) {
      data.amenities = dto.amenities;
    }
    if (dto.availability !== undefined) {
      data.availability = dto.availability.map((interval) => `[${interval.start.toISOString()},${interval.end.toISOString()})`);
    }
    return data;
  }

  
  private buildSearchQuery(
    searchDto: SearchListingsDto,
    userId?: number
  ): SelectQueryBuilder<Listing> {
    const query = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.pricings', 'pricing');

    if (userId !== undefined) {
      query.andWhere('listing.user.id = :userId', { userId });
    }
    if (searchDto.status !== undefined) {
      query.andWhere('listing.status = :status', { status: searchDto.status });
    }
    if (searchDto.type !== undefined) {
      query.andWhere('listing.type = :type', { type: searchDto.type });
    }
    if (searchDto.pricePeriod !== undefined || searchDto.minPrice !== undefined || searchDto.maxPrice !== undefined) {
      query.innerJoin('listing.pricings', 'filterPricing');
      
      if (searchDto.pricePeriod !== undefined) {
        query.andWhere('filterPricing.pricePeriod = :pricePeriod', { pricePeriod: searchDto.pricePeriod });
      }
      if (searchDto.minPrice !== undefined) {
        query.andWhere('filterPricing.price >= :minPrice', { minPrice: searchDto.minPrice });
      }
      if (searchDto.maxPrice !== undefined) {
        query.andWhere('filterPricing.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
      }
    }
    if (
      searchDto.longitude !== undefined &&
      searchDto.latitude !== undefined &&
      searchDto.radius !== undefined
    ) {
      query.andWhere(
        'ST_DWithin(listing.location::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)',
        { lon: searchDto.longitude, lat: searchDto.latitude, radius: searchDto.radius }
      );
    }
    if (searchDto.amenities && searchDto.amenities.length > 0) {
      query.andWhere('listing.amenities @> :amenities', { amenities: searchDto.amenities });
    }
    if (searchDto.title) {
      query.andWhere('listing.title ILIKE :title', { title: `%${searchDto.title}%` });
      // Сортируем по релевантности (насколько похоже), а не по дате
      // query.orderBy(`similarity(listing.title, :title)`, 'DESC');
      query.orderBy('listing.updatedAt', 'DESC');
    } else {
      // Стандартная сортировка, если поиска по названию нет
      query.orderBy('listing.updatedAt', 'DESC');
    }
    query.limit(searchDto.limit).offset(searchDto.offset);

    return query;
  }

  private canCacheUserActiveListings(
    userId: number | undefined,
    searchDto: SearchListingsDto,
  ): boolean {
    return userId !== undefined &&
           searchDto.status === ListingStatus.ACTIVE &&
           this.hasNoFilters(searchDto);
  }

  private canCacheTypeListings(
    userId: number | undefined,
    searchDto: SearchListingsDto,
  ): boolean {
    return userId === undefined &&
           searchDto.status === ListingStatus.ACTIVE &&
           this.hasOnlyTypeFilter(searchDto);
  }

  private hasNoFilters(dto: SearchListingsDto): boolean {
    const { limit, offset, status, ...rest } = dto;
    return Object.values(rest).every(val => val === undefined);
  }

  private hasOnlyTypeFilter(dto: SearchListingsDto): boolean {
    const { limit, offset, status, type, ...rest } = dto;
    return type !== undefined && Object.values(rest).every(val => val === undefined);
  }
}
