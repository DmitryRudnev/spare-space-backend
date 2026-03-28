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

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Не авторизован' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение списка бронирований',
    description: 'Возвращает список бронирований текущего пользователя с заданными фильтрами. Требует аутентификации.'
  })
  @ApiQuery({
    name: 'searchDto',
    type: SearchBookingsDto,
    required: false,
    description: 'Критерии поиска (статус, пагинация)'
  })
  @ApiOkResponse({
    description: 'Список бронирований пользователя',
    type: BookingListResponseDto
  })
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
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение одного бронирования',
    description: 'Возвращает детали бронирования по ID. Требует аутентификации и участия в бронировании.'
  })
  @ApiParam({ name: 'id', description: 'ID бронирования', type: Number })
  @ApiOkResponse({ description: 'Бронирование найдено', type: BookingDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Бронирование не найдено' })
  async findById(
    @Param('id') bookingId: string,
    @User('userId') userId: number
  ): Promise<BookingDetailResponseDto> {
    const booking = await this.bookingsService.handleFindById(userId, Number(bookingId));
    return BookingMapper.toDetailResponseDto(booking);
  }


  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Создание нового бронирования',
    description: 'Создаёт бронирование на основе предоставленных данных. Требует аутентификации и наличия роли арендатора.'
  })
  @ApiBody({ type: CreateBookingDto, description: 'Данные для создания бронирования' })
  @ApiCreatedResponse({ description: 'Бронирование успешно создано', type: BookingDetailResponseDto })
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
  @HttpCode(200)
  @ApiOperation({
    summary: 'Обновление периода бронирования',
    description: 'Изменяет период существующего бронирования. Только для арендатора и только pending-бронирований.'
  })
  @ApiParam({ name: 'id', description: 'ID бронирования для обновления', type: Number })
  @ApiBody({ type: UpdateBookingPeriodDto, description: 'Данные для обновления' })
  @ApiOkResponse({ description: 'Бронирование успешно обновлено', type: BookingDetailResponseDto })
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
  @HttpCode(200)
  @ApiOperation({
    summary: 'Подтверждение бронирования',
    description: 'Изменяет статус бронирования на ПОДТВЕРЖДЕНО. Только для владельца объекта.'
  })
  @ApiParam({ name: 'id', description: 'ID бронирования', type: Number })
  @ApiOkResponse({ description: 'Статус успешно изменён', type: BookingDetailResponseDto })
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
  @HttpCode(204)
  @ApiOperation({
    summary: 'Отмена бронирования',
    description: 'Выполняет отмену бронирования. Доступно для арендатора или владельца объекта.'
  })
  @ApiParam({ name: 'id', description: 'ID бронирования для отмены', type: Number })
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
