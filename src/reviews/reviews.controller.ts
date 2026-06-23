import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/requests/create-review.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ReviewResponseDto } from './dto/responses/review-response.dto';
import { ReviewListResponseDto } from './dto/responses/review-list-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { ReviewMapper } from './mappers/review.mapper';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('listing/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить отзывы для объявления' })
  @ApiParam({ type: Number, name: 'id', description: 'ID объявления' })
  @ApiOkResponse({ type: ReviewListResponseDto, description: 'Список отзывов' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async findByListing(
    @Param('id', ParseIntPipe) listingId: number,
    @Query() dto: PaginationDto,
  ): Promise<ReviewListResponseDto> {
    const result = await this.reviewsService.findByListingWithCache(listingId, dto.limit, dto.offset);
    return ReviewMapper.toListResponseDto(result.reviews, result.total, result.limit, result.offset);
  }

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить отзывы о пользователе' })
  @ApiParam({ type: Number, name: 'id', description: 'ID пользователя' })
  @ApiOkResponse({ type: ReviewListResponseDto, description: 'Список отзывов' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  async findByUser(
    @Param('id', ParseIntPipe) userId: number,
    @Query() dto: PaginationDto,
  ): Promise<ReviewListResponseDto> {
    const result = await this.reviewsService.findByUserWithCache(userId, dto.limit, dto.offset);
    return ReviewMapper.toListResponseDto(result.reviews, result.total, result.limit, result.offset);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить отзыв по ID' })
  @ApiParam({ name: 'id', description: 'ID отзыва', type: Number })
  @ApiOkResponse({ type: ReviewResponseDto, description: 'Информация об отзыве' })
  @ApiNotFoundResponse({ description: 'Отзыв не найден' })
  async findById(@Param('id', ParseIntPipe) reviewId: number): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.findById(reviewId);
    return ReviewMapper.toResponseDto(review);
  }
  
  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить мой отзыв по ID бронирования' })
  @ApiParam({ type: Number, name: 'bookingId', description: 'ID бронирования' })
  @ApiOkResponse({ type: ReviewResponseDto, description: 'Отзыв пользователя или null' })
  async findByBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @User('userId') userId: number,
  ): Promise<ReviewResponseDto | null> {
    const review = await this.reviewsService.findByBooking(bookingId, userId);
    return review === null ? null : ReviewMapper.toResponseDto(review);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать новый отзыв' })
  @ApiCreatedResponse({ type: ReviewResponseDto, description: 'Отзыв успешно создан' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Бронирование ещё не завершено или некорректные данные' })
  @ApiConflictResponse({ description: 'Отзыв по этому бронированию уже существует' })
  async create(
    @Body() createDto: CreateReviewDto,
    @User('userId') userId: number,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.create(userId, createDto);
    return ReviewMapper.toResponseDto(review);
  }
}
