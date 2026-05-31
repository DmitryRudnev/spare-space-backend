import { Injectable, UnauthorizedException } from '@nestjs/common';

import { Listing } from '../entities/listing.entity';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingsService } from './listings.service';
import { FavoritesService } from './favorites.service';
import { GeocoderService } from '../geocoder/geocoder.service';

import { CreateListingDto } from './dto/requests/create-listing.dto';
import { UpdateListingDto } from './dto/requests/update-listing.dto';
import { SearchListingsDto } from './dto/requests/search-listings.dto';

@Injectable()
export class ListingsControllerHandler {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly favoritesService: FavoritesService,
    private readonly geocoderService: GeocoderService,
  ) {}

  async findAllActive(
    searchDto: SearchListingsDto,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    await this.preprocessSearchDto(searchDto);
    searchDto.status = ListingStatus.ACTIVE;
    return this.listingsService.findAllWithCache(searchDto);
  }

  async findGeo(
    searchDto: SearchListingsDto,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    await this.preprocessSearchDto(searchDto);
    searchDto.status = ListingStatus.ACTIVE;
    return this.listingsService.findGeo(searchDto);
  }

  async findByUser(
    searchDto: SearchListingsDto,
    targetUserId: number,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    await this.preprocessSearchDto(searchDto);
    searchDto.status = ListingStatus.ACTIVE;
    return this.listingsService.findAllWithCache(searchDto, targetUserId);
  }

  async findMy(
    searchDto: SearchListingsDto,
    currentUserId: number,
  ): Promise<{ listings: Listing[]; total: number; limit: number; offset: number }> {
    await this.preprocessSearchDto(searchDto);
    return this.listingsService.findAllWithCache(searchDto, currentUserId);
  }

  async findById(listingId: number, currentUserId?: number): Promise<{ listing: Listing; isFavorite?: boolean }> {
    const isFavorite = currentUserId
      ? await this.favoritesService.existsByUser(listingId, currentUserId)
      : undefined;

    const listing = await this.listingsService.findByIdWithCache(listingId);
    if (listing.status !== ListingStatus.ACTIVE && currentUserId !== listing.user.id && !isFavorite) {
      throw new UnauthorizedException('Not authorized to see this listing');
    }

    if (currentUserId !== undefined) {
      await this.listingsService.updateViewHistory(listingId, currentUserId);
    }

    return { listing, isFavorite };
  }

  async create(createDto: CreateListingDto, currentUserId: number): Promise<Listing> {
    return this.listingsService.create(currentUserId, createDto);
  }
  
  async update(listingId: number, updateDto: UpdateListingDto, currentUserId: number): Promise<Listing> {
    await this.listingsService.validateListingOwnership(listingId, currentUserId);
    return this.listingsService.update(listingId, updateDto);
  }
  
  async delete(listingId: number, userId: number): Promise<void> {
    await this.listingsService.validateListingOwnership(listingId, userId);
    await this.listingsService.updateStatus(listingId, ListingStatus.INACTIVE);
  }

  // Приватный метод для геокодирования адреса в координаты перед поиском
  private async preprocessSearchDto(searchDto: SearchListingsDto): Promise<void> {
    if (
      searchDto.address &&
      searchDto.radius !== undefined &&
      searchDto.longitude === undefined &&
      searchDto.latitude === undefined
    ) {
      const coords = await this.geocoderService.getCoordinates(searchDto.address);
      if (coords) {
        searchDto.longitude = coords.longitude;
        searchDto.latitude = coords.latitude;
      }
    }
  }
}
