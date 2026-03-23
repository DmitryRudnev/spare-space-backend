import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Favorite } from '../entities/favorite.entity';
import { ListingsService } from 'src/listings/listings.service';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { SearchListingsDto } from '../listings/dto/requests/search-listings.dto';

@Injectable()
export class FavoritesService {
    constructor(
    @InjectRepository(Favorite) private readonly favoriteRepository: Repository<Favorite>,
    private readonly listingsService: ListingsService,
    ) {}

  /**
   * Возвращает пагинированный список избранных объявлений пользователя с фильтрацией
   * @param userId - ID пользователя
   * @param searchDto - DTO с параметрами фильтрации и пагинации
   * @returns Объект с массивом записей избранного, общим количеством и параметрами пагинации
   */
  async findAllByUser(
    userId: number,
    searchDto: SearchListingsDto,
  ): Promise<{ favorites: Favorite[]; total: number; limit: number; offset: number }> {
    const query = this.buildSearchQuery(userId, searchDto);
    
    const [favorites, total] = await query.getManyAndCount();
    
    return {
      favorites,
      total,
      limit: searchDto.limit,
      offset: searchDto.offset,
    };
  }

  /**
   * Находит запись избранного по ID с полными отношениями
   * @param favoriteId - ID записи избранного
   * @param userId - ID пользователя для проверки владения (опционально)
   * @returns Запись избранного с полными отношениями
   * @throws NotFoundException если запись не найдена
   * @throws UnauthorizedException если userId передан и пользователь не владеет записью
   */
  async findById(
    favoriteId: number, 
    userId?: number
  ): Promise<Favorite> {
    const favorite = await this.favoriteRepository.findOne({
      where: { id: favoriteId },
      relations: {
        listing: { user: true },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Запись избранного не найдена');
    }

    // Проверка владения, если передан userId
    if (userId !== undefined && favorite.user.id !== userId) {
      throw new UnauthorizedException('Недостаточно прав для доступа к записи');
    }

    return favorite;
  }

  /**
   * Добавляет объявление в избранное пользователя
   * @param listingId - ID объявления
   * @param userId - ID пользователя
   * @returns Созданная запись избранного
   * @throws NotFoundException если объявление не найдено или не активно
   * @throws ConflictException если объявление уже в избранном
   */
  async create(listingId: number, userId: number): Promise<Favorite> {
    // Проверяем существование и активность объявления
    await this.listingsService.validateExistence(listingId);

    // Проверяем, не добавлено ли уже в избранное
    const existingFavorite = await this.favoriteRepository.findOne({
      where: {
        user: { id: userId },
        listing: { id: listingId },
      },
    });
    if (existingFavorite) {
      throw new ConflictException('Объявление уже в избранном');
    }

    // Создаем и сохраняем запись
    const favorite = this.favoriteRepository.create({
      user: { id: userId },
      listing: { id: listingId },
    });
    await this.favoriteRepository.save(favorite);

    return this.findById(favorite.id);
  }

  /**
   * Удаляет запись избранного по ID
   * @param favoriteId - ID записи избранного
   * @param userId - ID пользователя для проверки владения
   * @throws NotFoundException если запись не найдена
   * @throws UnauthorizedException если пользователь не владеет записью
   */
  async remove(favoriteId: number, userId: number): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { id: favoriteId },
      relations: ['user'],
    });

    if (!favorite) {
      throw new NotFoundException('Запись избранного не найдена');
    }

    if (Number(favorite.user.id) !== userId) {
      throw new UnauthorizedException('Недостаточно прав для удаления записи');
    }

    await this.favoriteRepository.remove(favorite);
  }

  /**
   * Строит запрос с фильтрацией и пагинацией для избранных объявлений пользователя
   * @param userId - ID пользователя
   * @param searchDto - DTO с параметрами фильтрации
   * @returns Настроенный QueryBuilder
   */
  private buildSearchQuery(
    userId: number,
    searchDto: SearchListingsDto,
  ): SelectQueryBuilder<Favorite> {
    const query = this.favoriteRepository
      .createQueryBuilder('favorite')
      .innerJoinAndSelect('favorite.listing', 'listing')
      .innerJoinAndSelect('listing.user', 'listingUser')
      .where('favorite.user_id = :userId', { userId })
      .andWhere('listing.status = :status', { status: ListingStatus.ACTIVE });

    // Применяем фильтры из SearchListingsDto к связанному объявлению
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
        { lon: searchDto.longitude, lat: searchDto.latitude, radius: searchDto.radius },
      );
    }

    if (searchDto.amenities !== undefined) {
      Object.entries(searchDto.amenities).forEach(([key, value]) => {
        const paramName = `value_${key.replace(/\W/g, '_')}`;
        query.andWhere(`listing.amenities ->> '${key}' = :${paramName}`, {
          [paramName]: String(value),
        });
      });
    }

    // Сортировка по дате добавления в избранное (новые первыми)
    query
      .orderBy('favorite.created_at', 'DESC')
      .limit(searchDto.limit)
      .offset(searchDto.offset);

    return query;
  }
}
