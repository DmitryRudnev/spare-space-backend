import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import type { Point } from 'geojson';

import { UsersService } from '../users/services/users.service';
import { Listing } from '../entities/listing.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { Favorite } from '../entities/favorite.entity';
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

  private getTypeListingsCacheKey(types: ListingType[], limit: number, offset: number): string {
    const sortedTypes = [...types].sort().join('-');
    return `listings:${sortedTypes}:limit:${limit}:offset:${offset}`;
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
        this.getTypeListingsCacheKey(searchDto.types!, searchDto.limit, searchDto.offset),
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
    // Проверяем, смотрел ли пользователь это объявление ранее
    const alreadyViewed = await this.viewHistoryRepository.existsBy({
      user: { id: userId },
      listing: { id: listingId },
    });

    if (alreadyViewed) {
      return;
    }

    await this.listingRepository.increment({ id: listingId }, 'viewsCount', 1);
    await this.redisService.delete(this.getListingCacheKey(listingId));

    await this.viewHistoryRepository.insert({ 
      user: { id: userId }, 
      listing: { id: listingId }, 
    });
  }

  public applySearchFilters<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    searchDto: SearchListingsDto,
  ): SelectQueryBuilder<T> {
    if (searchDto.types && searchDto.types.length > 0) {
      query.andWhere(`listing.type IN (:...types)`, { types: searchDto.types });
    }
    if (searchDto.pricePeriod !== undefined) {
      query.andWhere(`pricing.pricePeriod = :pricePeriod`, { pricePeriod: searchDto.pricePeriod });
    }
    if (searchDto.minPrice !== undefined) {
      query.andWhere(`pricing.price >= :minPrice`, { minPrice: searchDto.minPrice });
    }
    if (searchDto.maxPrice !== undefined) {
      query.andWhere(`pricing.price <= :maxPrice`, { maxPrice: searchDto.maxPrice });
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
      query.andWhere(`listing.amenities @> :amenities::space_amenity[]`, { amenities: searchDto.amenities });
    }
    if (searchDto.title) {
      query
        .andWhere(`:title <% listing.title`, { title: searchDto.title })
        .addSelect('word_similarity(:title, listing.title)', 'similarity_score')
        .orderBy('similarity_score', 'DESC');
    }
    return query.take(searchDto.limit).skip(searchDto.offset);
  }

  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================

  private buildSearchQuery(
    searchDto: SearchListingsDto,
    userId?: number
  ): SelectQueryBuilder<Listing> {
    let query = this.listingRepository
      .createQueryBuilder('listing')
      .innerJoinAndSelect('listing.user', 'user')
      .innerJoinAndSelect('listing.pricings', 'pricing');

    if (userId !== undefined) {
      query.andWhere('user.id = :userId', { userId });
    }
    if (searchDto.status !== undefined) {
      query.andWhere('listing.status = :status', { status: searchDto.status });
    }
    if (!searchDto.title) {
      query.orderBy('listing.updatedAt', 'DESC');
    }
    return this.applySearchFilters(query, searchDto);
  }

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
        throw new BadRequestException('Price periods cannot be duplicated');
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
    const { limit, offset, status, types, ...rest } = dto;
    return types !== undefined && types.length > 0 && Object.values(rest).every(val => val === undefined);
  }
}
