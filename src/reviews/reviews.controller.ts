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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
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
  @ApiOperation({
    summary: 'Получить отзывы для объявления',
    description: 'Возвращает пагинированный список отзывов, оставленных гостями для указанного объявления.',
  })
  @ApiParam({ name: 'id', description: 'ID объявления', type: Number })
  @ApiQuery({ name: 'paginationDto', type: PaginationDto, required: false, description: 'Параметры пагинации' })
  @ApiOkResponse({ description: 'Список отзывов', type: ReviewListResponseDto })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async findByListing(
    @Param('id') listingId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<ReviewListResponseDto> {
    const result = await this.reviewsService.findByListingWithCache(
      Number(listingId),
      paginationDto.limit,
      paginationDto.offset,
    );
    return ReviewMapper.toListResponseDto(
      result.reviews,
      result.total,
      result.limit,
      result.offset,
    );
  }

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить отзывы о пользователе',
    description: 'Возвращает пагинированный список отзывов, оставленных заданному пользователю (как владельцу объявлений).',
  })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiQuery({ name: 'paginationDto', type: PaginationDto, required: false, description: 'Параметры пагинации' })
  @ApiOkResponse({ description: 'Список отзывов', type: ReviewListResponseDto })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  async findByUser(
    @Param('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<ReviewListResponseDto> {
    const result = await this.reviewsService.findByUserWithCache(
      Number(userId),
      paginationDto.limit,
      paginationDto.offset,
    );
    return ReviewMapper.toListResponseDto(
      result.reviews,
      result.total,
      result.limit,
      result.offset,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить отзыв по ID',
    description: 'Возвращает информацию о конкретном отзыве.',
  })
  @ApiParam({ name: 'id', description: 'ID отзыва', type: Number })
  @ApiOkResponse({ description: 'Информация об отзыве', type: ReviewResponseDto })
  @ApiNotFoundResponse({ description: 'Отзыв не найден' })
  async findOne(@Param('id') reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.findById(Number(reviewId));
    return ReviewMapper.toResponseDto(review);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создать новый отзыв',
    description: 'Позволяет аутентифицированному пользователю оставить отзыв о завершённом бронировании.',
  })
  @ApiBody({ type: CreateReviewDto, description: 'Данные для создания отзыва' })
  @ApiCreatedResponse({ description: 'Отзыв успешно создан', type: ReviewResponseDto })
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
