import { Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { ListingsControllerHandler } from './listings.controller-handler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { ListingMapper } from './mappers/listing.mapper';

import { CreateListingDto } from './dto/requests/create-listing.dto';
import { SearchListingsDto } from './dto/requests/search-listings.dto';
import { UpdateListingDto } from './dto/requests/update-listing.dto';
import { ListingDetailResponseDto } from './dto/responses/listing-detail-response.dto';
import { ListingListResponseDto } from './dto/responses/listing-list-response.dto';
import { ListingGeoListResponseDto } from './dto/responses/listing-geo-list-response.dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly handler: ListingsControllerHandler) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение списка объявлений с поиском по фильтрам' })
  @ApiOkResponse({ type: ListingListResponseDto, description: 'Список объявлений' })
  async findAll(@Query() searchDto: SearchListingsDto): Promise<ListingListResponseDto> {
    const result = await this.handler.findAllActive(searchDto);
    return ListingMapper.toListResponseDto(
      result.listings,
      result.total,
      result.limit,
      result.offset
    );
  }

  @Get('geo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение гео-списка объявлений для отображения на карте' })
  @ApiOkResponse({ type: ListingGeoListResponseDto, description: 'Список объявлений для карты' })
  async findGeo(@Query() searchDto: SearchListingsDto): Promise<ListingGeoListResponseDto> {
    const result = await this.handler.findGeo(searchDto);
    return ListingMapper.toGeoListResponseDto(
      result.listings,
      result.total,
      result.limit,
      result.offset,
    );
  }

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение активных объявлений заданного пользователя с фильтрацией' })
  @ApiParam({ type: Number, name: 'id', description: 'ID пользователя' })
  @ApiOkResponse({ type: ListingListResponseDto, description: 'Пагинированный список объявлений пользователя' })
  async findByUser(
    @Param('id') targetUserId: string,
    @Query() searchDto: SearchListingsDto,
  ): Promise<ListingListResponseDto> {
    const result = await this.handler.findByUser(searchDto, Number(targetUserId));
    return ListingMapper.toListResponseDto(
      result.listings,
      result.total,
      result.limit,
      result.offset
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение собственных объявлений с фильтрацией' })
  @ApiOkResponse({ type: ListingListResponseDto, description: 'Пагинированный список объявлений пользователя' })
  async findMy(
    @Query() searchDto: SearchListingsDto,
    @User('userId') currentUserId: number,
  ): Promise<ListingListResponseDto> {
    const result = await this.handler.findMy(searchDto, currentUserId);
    return ListingMapper.toListResponseDto(
      result.listings,
      result.total,
      result.limit,
      result.offset
    );
  }

  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение конкретного объявления' })
  @ApiParam({ type: Number, name: 'id', description: 'ID объявления' })
  @ApiOkResponse({ type: ListingDetailResponseDto, description: 'Объявление найдено' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async findOne(
    @Param('id') listingId: string, 
    @User('userId') userId?: number
  ): Promise<ListingDetailResponseDto> {
    const { listing, isFavorite } = await this.handler.findById(Number(listingId), userId);
    return ListingMapper.toDetailResponseDto(listing, isFavorite);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание нового объявления' })
  @ApiCreatedResponse({ type: ListingDetailResponseDto, description: 'Объявление успешно создано' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async create(
    @Body() createListingDto: CreateListingDto,
    @User('userId') userId: number
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.handler.create(createListingDto, userId);
    return ListingMapper.toDetailResponseDto(listing);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление объявления' })
  @ApiParam({ type: Number, name: 'id', description: 'ID объявления для обновления' })
  @ApiOkResponse({ type: ListingDetailResponseDto, description: 'Объявление успешно обновлено' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async update(
    @Param('id') listingId: string,
    @Body() updateListingDto: UpdateListingDto,
    @User('userId') userId: number
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.handler.update(Number(listingId), updateListingDto, userId);
    return ListingMapper.toDetailResponseDto(listing);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление объявления (soft-delete)' })
  @ApiParam({ type: Number, name: 'id', description: 'ID объявления для удаления' })
  @ApiNoContentResponse({ description: 'Объявление успешно удалено' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async delete(@Param('id') listingId: string, @User('userId') userId: number): Promise<void> {
    await this.handler.delete(Number(listingId), userId);
  }
}
