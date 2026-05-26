import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
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
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { FavoriteMapper } from './mappers/favorite.mapper';

import { CreateFavoriteDto } from './dto/requests/create-favorite.dto';
import { SearchListingsDto } from './dto/requests/search-listings.dto';
import { FavoriteResponseDto } from './dto/responses/favorite-response.dto';
import { FavoritesListResponseDto } from './dto/responses/favorites-list-response.dto';

@Controller('listings/favorites')
@UseGuards(JwtAuthGuard)
@ApiTags('Favorites')
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить список избранного текущего пользователя' })
  @ApiOkResponse({ type: FavoritesListResponseDto, description: 'Список избранных объявлений' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  async findAll(
    @Query() searchDto: SearchListingsDto,
    @User('userId') userId: number,
  ): Promise<FavoritesListResponseDto> {
    const result = await this.favoritesService.findAll(userId, searchDto);
    return FavoriteMapper.toListResponseDto(
      result.favorites,
      result.total,
      result.limit,
      result.offset,
      searchDto.pricePeriod,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Добавить объявление в избранное' })
  @ApiCreatedResponse({ type: FavoriteResponseDto, description: 'Объявление успешно добавлено в избранное' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  @ApiConflictResponse({ description: 'Объявление уже в избранном' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async create(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @User('userId') userId: number,
  ): Promise<FavoriteResponseDto> {
    const favorite = await this.favoritesService.create(createFavoriteDto.listingId, userId);
    return FavoriteMapper.toResponseDto(favorite);
  }
  
  @Delete(':listingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить объявление из избранного' })
  @ApiParam({ name: 'listingId', description: 'ID объявления', type: Number })
  @ApiNoContentResponse({ description: 'Запись успешно удалена из избранного' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован или доступ запрещен' })
  @ApiNotFoundResponse({ description: 'Запись избранного не найдена' })
  async remove(
    @Param('listingId', ParseIntPipe) listingId: number,
    @User('userId') userId: number,
  ): Promise<void> {
    await this.favoritesService.remove(listingId, userId);
  }
}
