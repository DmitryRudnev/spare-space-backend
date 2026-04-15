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

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/requests/create-booking.dto';
import { UpdateBookingPeriodDto } from './dto/requests/update-booking-period.dto';
import { SearchBookingsDto } from './dto/requests/search-bookings.dto';
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
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение списка бронирований текущего пользователя' })
  @ApiOkResponse({ type: BookingListResponseDto, description: 'Список бронирований' })
  async findAll(
    @Query() searchDto: SearchBookingsDto, 
    @User('userId') userId: number
  ): Promise<BookingListResponseDto> {
    const result = await this.bookingsService.handleFindAll(userId, searchDto);
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
    @Param('id') bookingId: string,
    @User('userId') userId: number
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingsService.handleFindById(userId, Number(bookingId));
    return BookingMapper.toDetailResponseDto(booking);
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
    const booking = await this.bookingsService.handleCreate(userId, createBookingDto);
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
    @Param('id') bookingId: string,
    @Body() updateBookingDto: UpdateBookingPeriodDto,
    @User('userId') userId: number
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingsService.handleUpdatePeriod(userId, Number(bookingId), updateBookingDto);
    return BookingMapper.toDetailResponseDto(booking);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Подтверждение бронирования' })
  @ApiParam({ type: Number, name: 'id', description: 'ID бронирования' })
  @ApiOkResponse({ type: BookingDetailResponseDto, description: 'Бронирование подтверждено' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Некорректный статус или операция' })
  async updateStatus(
    @Param('id') bookingId: string,
    @User('userId') userId: number
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingsService.handleConfirm(userId, Number(bookingId));
    return BookingMapper.toDetailResponseDto(booking);
  }
  
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отмена бронирования' })
  @ApiParam({ type: Number, name: 'id', description: 'ID бронирования для отмены' })
  @ApiNoContentResponse({ description: 'Бронирование успешно отменено' })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  @ApiBadRequestResponse({ description: 'Невозможно отменить бронирование' })
  async remove(
    @Param('id') bookingId: string,
    @User('userId') userId: number
  ): Promise<void> {
    await this.bookingsService.handleCancel(userId, Number(bookingId));
  }
}
