import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
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
  ApiQuery,
} from '@nestjs/swagger';

import { BookingsHandler } from './bookings.handler';
import { CreateBookingDto } from './dto/requests/create-booking.dto';
import { UpdateBookingPeriodDto } from './dto/requests/update-booking-period.dto';
import { SearchBookingsDto } from './dto/requests/search-bookings.dto';
import { GetAvailabilityDto } from './dto/requests/get-availability.dto';
import { PeriodDto } from '../common/dto/period.dto';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingDetailResponseDto } from './dto/responses/booking-detail-response.dto';
import { BookingListResponseDto } from './dto/responses/booking-list-response.dto';
import { BookingMapper } from './mappers/booking.mapper';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiTags('Bookings')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Не авторизован' })
export class BookingsController {
  constructor(private readonly bookingsHandler: BookingsHandler) {}

  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение списка бронирований текущего пользователя' })
  @ApiOkResponse({ type: BookingListResponseDto, description: 'Список бронирований' })
  async findAll(
    @Query() searchDto: SearchBookingsDto, 
    @User('userId') userId: number
  ): Promise<BookingListResponseDto> {
    const result = await this.bookingsHandler.findAll(userId, searchDto);
    return BookingMapper.toListResponseDto(
      result.bookings,
      result.total,
      result.limit,
      result.offset
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение одного бронирования' })
  @ApiParam({ type: Number, name: 'id', description: 'ID бронирования' })
  @ApiOkResponse({ type: BookingDetailResponseDto, description: 'Бронирование найдено' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  async findById(
    @Param('id', ParseIntPipe) bookingId: number,
    @User('userId') userId: number
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingsHandler.findById(userId, bookingId);
    return BookingMapper.toDetailResponseDto(booking);
  }

  @Get('availability/:listingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение фактических периодов доступности объявления' })
  @ApiParam({ type: Number, name: 'listingId', description: 'ID объявления' })
  @ApiQuery({ 
    name: 'excludeBookingId', 
    type: Number, 
    required: false, 
    description: 'ID бронирования, которое нужно исключить из вычислений (например, при обновлении дат)' 
  })
  @ApiOkResponse({ type: [PeriodDto], description: 'Список доступных периодов' })
  async getListingAvailability(
    @Param('listingId', ParseIntPipe) listingId: number,
    @User('userId') userId: number,
    @Query() query: GetAvailabilityDto,
  ): Promise<PeriodDto[]> {
    return this.bookingsHandler.getListingAvailability(userId, listingId, query.excludeBookingId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создание нового бронирования' })
  @ApiCreatedResponse({ type: BookingDetailResponseDto, description: 'Бронирование успешно создано' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  @ApiConflictResponse({ description: 'Конфликт: объект недоступен для бронирования' })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @User('userId') userId: number
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingsHandler.create(userId, createBookingDto);
    return BookingMapper.toDetailResponseDto(booking);
  }

  @Patch(':id/period')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление периода бронирования' })
  @ApiParam({ type: Number, name: 'id', description: 'ID бронирования для обновления' })
  @ApiOkResponse({ type: BookingDetailResponseDto, description: 'Бронирование успешно обновлено' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  @ApiConflictResponse({ description: 'Конфликт: объект недоступен для новых дат' })
  async update(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() updateBookingDto: UpdateBookingPeriodDto,
    @User('userId') userId: number
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingsHandler.updatePeriod(userId, bookingId, updateBookingDto);
    return BookingMapper.toDetailResponseDto(booking);
  }
  
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отмена бронирования' })
  @ApiParam({ type: Number, name: 'id', description: 'ID бронирования для отмены' })
  @ApiNoContentResponse({ description: 'Бронирование успешно отменено' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Невозможно отменить бронирование' })
  async cancel(
    @Param('id', ParseIntPipe) bookingId: number,
    @User('userId') userId: number
  ): Promise<void> {
    await this.bookingsHandler.cancel(userId, bookingId);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Подтверждение бронирования' })
  @ApiParam({ type: Number, name: 'id', description: 'ID бронирования' })
  @ApiOkResponse({ type: BookingDetailResponseDto, description: 'Бронирование подтверждено' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Некорректный статус или операция' })
  async confirm(
    @Param('id', ParseIntPipe) bookingId: number,
    @User('userId') userId: number
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingsHandler.confirm(userId, bookingId);
    return BookingMapper.toDetailResponseDto(booking);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отклонение бронирования' })
  @ApiParam({ type: Number, name: 'id', description: 'ID бронирования' })
  @ApiNoContentResponse({ description: 'Бронирование успешно отклонено' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Невозможно отклонить бронирование' })
  async reject(
    @Param('id', ParseIntPipe) bookingId: number,
    @User('userId') userId: number
  ): Promise<void> {
    await this.bookingsHandler.reject(userId, bookingId);
  }
}
