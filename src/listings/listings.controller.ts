import { Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { ListingMapper } from './mappers/listing.mapper';

import { CreateListingDto } from './dto/requests/create-listing.dto';
import { SearchListingsDto } from './dto/requests/search-listings.dto';
import { UpdateListingDto } from './dto/requests/update-listing.dto';
import { ListingDetailResponseDto } from './dto/responses/listing-detail-response.dto';
import { ListingListResponseDto } from './dto/responses/listing-list-response.dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение списка объявлений с поиском',
    description: 'Возвращает список объявлений с фильтрацией по критериям поиска. Аутентификация не требуется.'
  })
  @ApiQuery({
    name: 'searchDto',
    type: SearchListingsDto,
    required: false,
    description: 'Критерии поиска (тип, цена, геолокация и т.д.)'
  })
  @ApiOkResponse({
    description: 'Список объявлений',
    type: ListingListResponseDto
  })
  async findAll(@Query() searchDto: SearchListingsDto): Promise<ListingListResponseDto> {
    const result = await this.listingsService.handleFindAllActive(searchDto);
    return ListingMapper.toListResponseDto(
      result.listings,
      result.total,
      result.limit,
      result.offset
    );
  }


  @UseGuards(OptionalJwtGuard)
  @Get('user/:id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение объявлений пользователя (авторизация опциональна)',
    description: 'Возвращает список объявлений указанного пользователя с фильтрацией. ' +
      'Аутентификация позволяет получить объявления со статусами DRAFT (если пользователь ищет свои объявления).'
  })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiQuery({
    name: 'searchDto',
    type: SearchListingsDto,
    required: false,
    description: 'Критерии поиска для объявлений пользователя'
  })
  @ApiOkResponse({
    description: 'Пагинированный список объявлений пользователя',
    type: ListingListResponseDto
  })
  async findByUser(
    @Param('id') targetUserId: string,
    @Query() searchDto: SearchListingsDto,
    @User('userId') userId?: number
  ): Promise<ListingListResponseDto> {
    const result = await this.listingsService.handleFindByUser(
      searchDto,
      Number(targetUserId),
      userId,
    );
    return ListingMapper.toListResponseDto(
      result.listings,
      result.total,
      result.limit,
      result.offset
    );
  }


  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение одного объявления (авторизация опциональна)',
    description: 'Возвращает детализированное объявление. ' +
      'Аутентификация позволяет создать новую запись в таблице историй просмотров объявлений.'
  })
  @ApiParam({ name: 'id', description: 'ID объявления', type: Number })
  @ApiOkResponse({
    description: 'Объявление найдено',
    type: ListingDetailResponseDto
  })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async findOne(
    @Param('id') listingId: string, 
    @User('userId') userId?: number
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.listingsService.handleFindById(Number(listingId), userId);
    return ListingMapper.toDetailResponseDto(listing);
  }

  
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создание нового объявления',
    description: 'Создаёт объявление на основе предоставленных данных. Требует аутентификации.'
  })
  @ApiBody({ type: CreateListingDto, description: 'Данные для создания объявления' })
  @ApiCreatedResponse({ 
    description: 'Объявление успешно создано', 
    type: ListingDetailResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async create(
    @Body() createListingDto: CreateListingDto,
    @User('userId') userId: number
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.listingsService.handleCreate(createListingDto, userId);
    return ListingMapper.toDetailResponseDto(listing);
  }


  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновление объявления',
    description: 'Обновляет существующее объявление. Требует аутентификации и владения объявлением.'
  })
  @ApiParam({ name: 'id', description: 'ID объявления для обновления', type: Number })
  @ApiBody({ type: UpdateListingDto, description: 'Данные для обновления' })
  @ApiOkResponse({ 
    description: 'Объявление успешно обновлено', 
    type: ListingDetailResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async update(
    @Param('id') listingId: string,
    @Body() updateListingDto: UpdateListingDto,
    @User('userId') userId: number
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.listingsService.handleUpdate(Number(listingId), updateListingDto, userId);
    return ListingMapper.toDetailResponseDto(listing);
  }


  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Удаление объявления',
    description: 'Выполняет soft-delete объявления путём установки статуса INACTIVE. ' +
      'Требует аутентификации и владения объявлением.'
  })
  @ApiParam({ name: 'id', description: 'ID объявления для удаления', type: Number })
  @ApiNoContentResponse({ description: 'Объявление успешно удалено (soft-delete)' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async delete(@Param('id') listingId: string, @User('userId') userId: number): Promise<void> {
    return this.listingsService.handleDelete(Number(listingId), userId);
  }
}
