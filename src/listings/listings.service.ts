import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, FindOptionsWhere } from 'typeorm';
import type { Point } from 'geojson';

import { UsersService } from '../users/services/users.service';
import { Listing } from '../entities/listing.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';

import { CreateListingDto } from './dto/requests/create-listing.dto';
import { UpdateListingDto } from './dto/requests/update-listing.dto';
import { SearchListingsDto } from './dto/requests/search-listings.dto';


@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing) private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ViewHistory) private readonly viewHistoryRepository: Repository<ViewHistory>,
    private readonly usersService: UsersService,
  ) {}


  // ==========================================================================
  // =============================== USE CASES ================================
  // ==========================================================================


  async handleFindAllActive(
    searchDto: SearchListingsDto,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    const allowedStatuses = [ListingStatus.ACTIVE];
    return this.findAll(searchDto, allowedStatuses);
  }


  async handleFindByUser(
    searchDto: SearchListingsDto,
    targetUserId: number,
    currentUserId?: number,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    const allowedStatuses = currentUserId === targetUserId
      ? undefined  // любой статус
      : [ListingStatus.ACTIVE];
    
    return this.findAll(searchDto, allowedStatuses, targetUserId);
  }


  async handleFindById(listingId: number, currentUserId?: number): Promise<Listing> {
    const listing = await this.findById(listingId);
    if (listing.status !== ListingStatus.ACTIVE && currentUserId !== Number(listing.user.id)) {
      throw new UnauthorizedException('Not authorized to see this listing');
    }
    if (currentUserId !== undefined) {
      await this.saveViewToHistory(listingId, currentUserId);
    }
    return listing;
  }


  async handleCreate(createDto: CreateListingDto, currentUserId: number): Promise<Listing> {
    return this.create(currentUserId, createDto);
  }

  
  async handleUpdate(listingId: number, updateDto: UpdateListingDto, currentUserId: number): Promise<Listing> {
    await this.validateListingOwnership(listingId, currentUserId);
    return this.update(listingId, updateDto);
  }

  
  async handleDelete(listingId: number, userId: number): Promise<void> {
    await this.validateListingOwnership(listingId, userId);
    await this.updateStatus(listingId, ListingStatus.INACTIVE);
  }


  // ==========================================================================
  // =============================== PUBLIC API ===============================
  // ==========================================================================


  async findAll(
    searchDto: SearchListingsDto,
    statuses?: ListingStatus[],
    userId?: number,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    if (userId !== undefined) {
      await this.usersService.validateUserExistence(userId);
    }
    const [listings, total] = await this.buildSearchQuery(
      searchDto,
      statuses,
      userId,
    ).getManyAndCount();

    return { listings, total, limit: searchDto.limit, offset: searchDto.offset };
  }


  async findById(listingId: number): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: {
        user: true
      }
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }


  async create(userId: number, createDto: CreateListingDto): Promise<Listing> {
    const user = await this.usersService.findById(userId);
    const listingData = this.prepareListingData(createDto, { user, status: ListingStatus.ACTIVE });  // пока что для разработки статус ACTIVE; потом сделать DRAFT
    const listing = this.listingRepository.create(listingData);

    const hasLandlordRole = await this.usersService.hasRole(userId, UserRoleType.LANDLORD);
    if (!hasLandlordRole) {
      await this.usersService.addRole(userId, UserRoleType.LANDLORD);
    }

    return this.listingRepository.save(listing);
  }


  async update(listingId: number, updateDto: UpdateListingDto): Promise<Listing> {
    const listing = await this.findById(listingId);
    const updatedData = this.prepareListingData(updateDto, listing);
    Object.assign(listing, updatedData);
    return this.listingRepository.save(listing);
    // const updatedListing = this.listingRepository.create(updatedData);
    // return this.listingRepository.save(updatedListing);
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
  

  async validateListingExistence(listingId: number): Promise<void> {
    if (! await this.exists(listingId)) {
      throw new NotFoundException('Listing not found');
    }
  }


  async validateListingOwnership(listingId: number, userId: number): Promise<void> {
    const exists = await this.listingRepository.exists({
      where: {
        id: listingId,
        user: { id: userId },
      }
    });
    if (!exists) {
      throw new UnauthorizedException('Not authorized to modify this listing');
    }
  }


  async updateStatus(listingId: number, newStatus: ListingStatus): Promise<void> {
    const listing = await this.findById(listingId);
    listing.status = newStatus;
    await this.listingRepository.save(listing);
  }


  async saveViewToHistory(listingId: number, userId: number) {
    await this.validateListingExistence(listingId);
    await this.usersService.validateUserExistence(userId);
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
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.pricePeriod !== undefined) data.pricePeriod = dto.pricePeriod;
    if (dto.currency !== undefined) data.currency = dto.currency;
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
      data.availability = dto.availability.map((interval) => `[${interval.start},${interval.end})`);
    }
    return data;
  }

  
  private buildSearchQuery(
    searchDto: SearchListingsDto,
    statuses?: ListingStatus[],
    userId?: number
  ): SelectQueryBuilder<Listing> {
    const query = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user');

    if (statuses?.length) {
      query.andWhere('listing.status IN (:...statuses)', { statuses });
    }
    if (userId !== undefined) {
      query.andWhere('listing.user_id = :userId', { userId });
    }
    if (searchDto.type !== undefined) {
      query.andWhere('listing.type = :type', { type: searchDto.type });
    }
    if (searchDto.currency !== undefined) {
      query.andWhere('listing.currency = :currency', { currency: searchDto.currency });
    }
    if (searchDto.minPrice !== undefined) {
      query.andWhere('listing.price >= :minPrice', { minPrice: searchDto.minPrice });
    }
    if (searchDto.maxPrice !== undefined) {
      query.andWhere('listing.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
    }
    if (searchDto.pricePeriod !== undefined) {
      query.andWhere('listing.price_period = :pricePeriod', { pricePeriod: searchDto.pricePeriod });
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
    if (searchDto.amenities !== undefined) {
        Object.entries(searchDto.amenities).forEach( ([key, value]) => {
          const paramName = `value_${key.replace(/\W/g, '_')}`;
          query.andWhere(`listing.amenities ->> '${key}' = :${paramName}`, { [paramName]: String(value) });
        });
    }
    query.orderBy('listing.updated_at', 'DESC').limit(searchDto.limit).offset(searchDto.offset);

    return query;
  }
}
