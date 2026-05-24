import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';

import { Favorite } from '../entities/favorite.entity';
import { ListingsService } from './listings.service';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { SearchListingsDto } from './dto/requests/search-listings.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private readonly favoriteRepository: Repository<Favorite>,
    private readonly listingsService: ListingsService,
  ) {}

  async findAll(
    userId: number,
    searchDto: SearchListingsDto,
  ): Promise<{ favorites: Favorite[]; total: number; limit: number; offset: number }> {
    const query = this.buildSearchQuery(searchDto, userId);
    
    const [favorites, total] = await query.getManyAndCount();
    
    return { favorites, total, limit: searchDto.limit, offset: searchDto.offset };
  }

  async findById(favoriteId: number): Promise<Favorite> {
    const favorite = await this.favoriteRepository.findOne({
      where: { id: favoriteId },
      relations: { listing: { user: true } },
    });

    if (!favorite) {
      throw new NotFoundException('Запись избранного не найдена');
    }

    return favorite;
  }

  async existsByUser(listingId: number, userId: number): Promise<boolean> {
    return this.favoriteRepository.existsBy({
      listing: { id: listingId },
      user: { id: userId },
    });
  }

  async create(listingId: number, userId: number): Promise<Favorite> {
    // Проверяем существование и активность объявления
    const listing = await this.listingsService.findById(listingId);
    if (Number(listing.user.id) === userId) {
      throw new ConflictException('Нельзя добавлять свои объявления в избранное');
    }
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new ConflictException('Нельзя добавлять неактивные объявления в избранное');
    }

    const where = {
      user: { id: userId },
      listing: { id: listingId },
    }

    // Проверяем, не добавлено ли уже в избранное
    const existingFavorite = await this.favoriteRepository.findOne({ where });
    if (existingFavorite) {
      throw new ConflictException('Объявление уже в избранном');
    }

    // Создаем и сохраняем запись
    const favorite = this.favoriteRepository.create(where);
    await this.favoriteRepository.save(favorite);

    return this.findById(favorite.id);
  }

  async remove(listingId: number, userId: number): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        listing: {id: listingId },
        user: { id: userId },
      },
      relations: { user: true },
    });

    if (!favorite) {
      throw new NotFoundException('Запись избранного не найдена');
    }
    
    await this.favoriteRepository.remove(favorite);
  }

  private buildSearchQuery(
    searchDto: SearchListingsDto,
    userId: number,
  ): SelectQueryBuilder<Favorite> {
    let query = this.favoriteRepository
      .createQueryBuilder('favorite')
      .innerJoinAndSelect('favorite.listing', 'listing')
      .innerJoinAndSelect('listing.user', 'listingUser')
      .innerJoinAndSelect('listing.pricings', 'pricing')
      .where('favorite.user.id = :userId', { userId });

    query = this.listingsService.applySearchFilters(query, searchDto);
    return query.orderBy('favorite.createdAt', 'DESC');
  }
}
