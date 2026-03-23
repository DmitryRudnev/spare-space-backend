import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
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
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { UserSubscriptionsService } from '../services/user-subscriptions.service';
import { CreateUserSubscriptionDto } from '../dto/user-subscriptions/requests/create-user-subscription.dto';
import { GetUserSubscriptionsDto } from '../dto/user-subscriptions/requests/get-user-subscriptions-query.dto';
import { UserSubscriptionDetailResponseDto } from '../dto/user-subscriptions/responses/user-subscription-detail-response.dto';
import { UserSubscriptionListResponseDto } from '../dto/user-subscriptions/responses/user-subscription-list-response.dto';
import { UserSubscriptionMapper } from '../mappers/user-subscription.mapper';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('User Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserSubscriptionsController {
  constructor(private readonly subscriptionsService: UserSubscriptionsService) {}

  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить подписки текущего пользователя',
    description: 'Возвращает пагинированный список подписок текущего пользователя с возможностью фильтрации по статусу.',
  })
  @ApiQuery({ type: GetUserSubscriptionsDto, description: 'Параметры пагинации и фильтрации' })
  @ApiOkResponse({ description: 'Список подписок', type: UserSubscriptionListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  async findAllForCurrentUser(
    @User('userId') userId: number,
    @Query() query: GetUserSubscriptionsDto,
  ): Promise<UserSubscriptionListResponseDto> {
    const result = await this.subscriptionsService.findByUser(
      userId,
      query.limit,
      query.offset,
      query.status,
    );
    return UserSubscriptionMapper.toListResponseDto(
      result.subscriptions,
      result.total,
      result.limit,
      result.offset,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить подписку по ID',
    description: 'Возвращает детальную информацию о подписке, если она принадлежит текущему пользователю.',
  })
  @ApiParam({ name: 'id', description: 'ID подписки', type: Number })
  @ApiOkResponse({ description: 'Детальная информация о подписке', type: UserSubscriptionDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Подписка не найдена' })
  @ApiForbiddenResponse({ description: 'Нет доступа к этой подписке' })
  async findOne(
    @Param('id') subscriptionId: string,
    @User('userId') userId: number,
  ): Promise<UserSubscriptionDetailResponseDto> {
    const subscription = await this.subscriptionsService.handleFindById(
      userId,
      Number(subscriptionId),
    );
    return UserSubscriptionMapper.toDetailResponseDto(subscription);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать новую подписку',
    description: 'Позволяет арендодателю приобрести подписку на тарифный план.',
  })
  @ApiBody({ type: CreateUserSubscriptionDto, description: 'Данные для создания подписки' })
  @ApiCreatedResponse({ description: 'Подписка успешно создана', type: UserSubscriptionDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные или пользователь не является арендодателем' })
  @ApiConflictResponse({ description: 'У пользователя уже есть активная подписка на этот план' })
  @ApiNotFoundResponse({ description: 'Тарифный план не найден' })
  async create(
    @Body() dto: CreateUserSubscriptionDto,
    @User('userId') userId: number,
  ): Promise<UserSubscriptionDetailResponseDto> {
    const subscription = await this.subscriptionsService.create(
      userId,
      dto.planId,
      dto.startDate,
      dto.monthsCount,
    );
    return UserSubscriptionMapper.toDetailResponseDto(subscription);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Отменить подписку',
    description: 'Отменяет активную подписку (меняет статус на CANCELLED).',
  })
  @ApiParam({ name: 'id', description: 'ID подписки', type: Number })
  @ApiOkResponse({ description: 'Подписка отменена', type: UserSubscriptionDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Подписка не найдена' })
  @ApiForbiddenResponse({ description: 'Нет доступа к этой подписке' })
  @ApiBadRequestResponse({ description: 'Подписка не активна или не может быть отменена' })
  async cancel(
    @Param('id') subscriptionId: string,
    @User('userId') userId: number,
  ): Promise<UserSubscriptionDetailResponseDto> {
    const subscription = await this.subscriptionsService.handleCancel(
      userId,
      Number(subscriptionId),
    );
    return UserSubscriptionMapper.toDetailResponseDto(subscription);
  }
}
