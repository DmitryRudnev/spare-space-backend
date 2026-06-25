import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Review } from '../entities/review.entity';
import { CreateReviewDto } from './dto/requests/create-review.dto';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { BookingsService } from '../bookings/bookings.service';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/services/users.service';
import { NotificationType } from '../common/enums/notification-type.enum';
import { RedisService } from '../common/redis/redis.service';
import { PaginatedReviewsDto } from './dto/paginated-reviews.dto';

@Injectable()
export class ReviewsService {
  private readonly REVIEWS_LISTING_CACHE_PREFIX = 'reviews:listing:';
  private readonly REVIEWS_USER_CACHE_PREFIX = 'reviews:user:';
  private readonly REVIEWS_CACHE_TTL_SEC = 3600; // 1 час

  constructor(
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    private readonly bookingsService: BookingsService,
    private readonly listingsService: ListingsService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
  ) {}

  // ==========================================================================
  // ================================= REDIS ==================================
  // ==========================================================================
  
  private getListingCacheKey(listingId: number, limit: number, offset: number): string {
    return `${this.REVIEWS_LISTING_CACHE_PREFIX}${listingId}:limit:${limit}:offset:${offset}`;
  }

  private getUserCacheKey(userId: number, limit: number, offset: number): string {
    return `${this.REVIEWS_USER_CACHE_PREFIX}${userId}:limit:${limit}:offset:${offset}`;
  }

  private async invalidateListingCache(listingId: number): Promise<void> {
    const pattern = `${this.REVIEWS_LISTING_CACHE_PREFIX}${listingId}:*`;
    await this.redisService.deleteByPattern(pattern);
  }

  private async invalidateUserCache(userId: number): Promise<void> {
    const pattern = `${this.REVIEWS_USER_CACHE_PREFIX}${userId}:*`;
    await this.redisService.deleteByPattern(pattern);
  }

  async findByListingWithCache(
    listingId: number,
    limit: number,
    offset: number,
  ): Promise<PaginatedReviewsDto> {
    return this.redisService.getOrSet(
      this.getListingCacheKey(listingId, limit, offset),
      this.REVIEWS_CACHE_TTL_SEC,
      () => this.findByListing(listingId, limit, offset),
      PaginatedReviewsDto
    );
  }

  async findByUserWithCache(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<PaginatedReviewsDto> {
    return this.redisService.getOrSet(
      this.getUserCacheKey(userId, limit, offset),
      this.REVIEWS_CACHE_TTL_SEC,
      () => this.findByUser(userId, limit, offset),
      PaginatedReviewsDto
    );
  }

  async findByListing(
    listingId: number,
    limit: number,
    offset: number,
  ): Promise<PaginatedReviewsDto> {
    const listing = await this.listingsService.findByIdWithCache(listingId);
    const where: FindOptionsWhere<Review> = {
      booking: { listing: { id: listingId } },
      reviewer: Not(listing.user.id)
    };
    return this.findAll(where, limit, offset);
  }
  
  // Ищет отзывы о пользователе, только как о владельце
  async findByUser(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<PaginatedReviewsDto> {
    const where: FindOptionsWhere<Review> = {
      booking: { listing: { user: { id: userId } } },
      reviewer: Not(userId),
    };
    return this.findAll(where, limit, offset);
  }

  // ==========================================================================
  // =========================== REPOSITORY METHODS ===========================
  // ==========================================================================

  async findAll(
    where: FindOptionsWhere<Review>,
    limit: number,
    offset: number,
  ): Promise<PaginatedReviewsDto> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where,
      relations: {
        booking: { listing: { user: true, pricings: true }, renter: true },
        reviewer: true,
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { reviews, total, limit, offset };
  }

  async findById(reviewId: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: {
        booking: { listing: { user: true, pricings: true }, renter: true },
        reviewer: true,
      },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  async findByBooking(bookingId: number, reviewerId: number): Promise<Review | null> {
    return this.reviewRepository.findOne({
      where: {
        booking: { id: bookingId },
        reviewer: { id: reviewerId },
      },
      relations: {
        booking: { listing: { user: true, pricings: true }, renter: true },
        reviewer: true,
      },
    });
  }

  async create(reviewerId: number, dto: CreateReviewDto): Promise<Review> {
    // Проверяем, что пользователь является участником бронирования и что это бронирование уже завершено
    await this.bookingsService.validateUserParticipation(dto.bookingId, reviewerId);
    const booking = await this.bookingsService.findById(dto.bookingId);
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be reviewed');
    }

    // Проверяем, что пользователь ещё не оставлял отзыв по этому бронированию
    const existingReview = await this.reviewRepository.findOne({ where: {
      booking: { id: dto.bookingId },
      reviewer: { id: reviewerId },
    }});
    if (existingReview) {
      throw new ConflictException('Review already exists for this booking');
    }
    
    // Создаём сам отзыв
    const reviewEntity = this.reviewRepository.create({
      booking: { id: dto.bookingId },
      reviewer: { id: reviewerId },
      rating: dto.rating,
      text: dto.text,
    });
    await this.reviewRepository.save(reviewEntity);
    const review = await this.findById(reviewEntity.id);

    // Обновляем рейтинг пользователю
    const isReviewForLandlord = reviewerId === booking.renter.id;
    const targetUserId = isReviewForLandlord
      ? booking.listing.user.id
      : booking.renter.id;
    await this.updateRatingForUser(targetUserId, isReviewForLandlord);
    
    // Эмитим уведомление
    this.eventEmitter.emit('notification.signal', {
      targetUserId,
      type: NotificationType.REVIEW_NEW,
      referenceId: review.id,
      payload: {
        reviewId: review.id,
        bookingId: booking.id,
        listingId: booking.listing.id,
        listingTitle: booking.listing.title,
        fromUserName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
        rating: review.rating,
      },
    });

    // Инвалидируем кеш для userId и listingId
    await this.invalidateUserCache(targetUserId);
    if (isReviewForLandlord) {
      await this.invalidateListingCache(review.booking.listing.id);
    }

    return review;
  }

  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================

  private async updateRatingForUser(userId: number, isReviewForLandlord: boolean): Promise<void> {
    const ratings = isReviewForLandlord
      ? await this.reviewRepository.find({
          where: { reviewer: { id: Not(userId) }, booking: { listing: { user: { id: userId } } } },
          select: { rating: true }
        })
      : await this.reviewRepository.find({
          where: { reviewer: { id: Not(userId) }, booking: { renter: { id: userId } } },
          select: { rating: true }
        })
      ;

    if (ratings.length === 0) {
      return;
    }

    let sum = 0;
    for (const r of ratings) {
      sum += r.rating;
    }
    const newRating = sum / ratings.length;

    if (isReviewForLandlord) {
      await this.usersService.update(userId, { landlordRating: newRating });
    } else {
      await this.usersService.update(userId, { renterRating: newRating });
    }
  }
}
