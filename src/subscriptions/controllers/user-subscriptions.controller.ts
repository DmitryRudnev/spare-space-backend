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

  @Get('my/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить активную подписку текущего пользователя' })
  @ApiOkResponse({ type: UserSubscriptionDetailResponseDto, description: 'Текущая подписка' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  async findActiveByUser(
    @User('userId') userId: number,
  ): Promise<UserSubscriptionDetailResponseDto | null> {
    const subscription = await this.subscriptionsService.findActiveByUser(userId);
    return subscription
      ? UserSubscriptionMapper.toDetailResponseDto(subscription)
      : null;
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить подписки текущего пользователя' })
  @ApiOkResponse({ type: UserSubscriptionListResponseDto, description: 'Список подписок' })
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Оформить подписку' })
  @ApiCreatedResponse({ type: UserSubscriptionDetailResponseDto, description: 'Подписка успешно создана' })
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
  @ApiOperation({ summary: 'Отменить подписку' })
  @ApiParam({ type: Number, name: 'id', description: 'ID подписки' })
  @ApiOkResponse({ type: UserSubscriptionDetailResponseDto, description: 'Подписка отменена' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Подписка не найдена' })
  @ApiForbiddenResponse({ description: 'Нет доступа к этой подписке' })
  @ApiBadRequestResponse({ description: 'Подписка не активна или не может быть отменена' })
  async cancel(
    @Param('id') subscriptionId: string,
    @User('userId') userId: number,
  ): Promise<UserSubscriptionDetailResponseDto> {
    const subscription = await this.subscriptionsService.handleCancel(userId, Number(subscriptionId));
    return UserSubscriptionMapper.toDetailResponseDto(subscription);
  }
}
