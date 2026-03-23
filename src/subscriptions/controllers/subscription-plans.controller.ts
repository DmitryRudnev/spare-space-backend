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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { SubscriptionPlansService } from '../services/subscription-plans.service';
import { CreateSubscriptionPlanDto } from '../dto/subscription-plans/requests/create-subscription-plan.dto';
import { UpdateSubscriptionPlanInfoDto } from '../dto/subscription-plans/requests/update-subscription-plan-info.dto';
import { UpdateSubscriptionPlanStatusDto } from '../dto/subscription-plans/requests/update-subscription-plan-status.dto';
import { SubscriptionPlanDetailResponseDto } from '../dto/subscription-plans/responses/subscription-plan-detail-response.dto';
import { SubscriptionPlanListResponseDto } from '../dto/subscription-plans/responses/subscription-plan-list-response.dto';
import { SubscriptionPlanMapper } from '../mappers/subscription-plan.mapper';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoleType } from '../../common/enums/user-role-type.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Subscription Plans')
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить все активные тарифные планы',
    description: 'Возвращает пагинированный список активных тарифных планов. Доступно без авторизации.',
  })
  @ApiQuery({ name: 'pagination', type: PaginationDto, required: false, description: 'Параметры пагинации' })
  @ApiOkResponse({ description: 'Список планов', type: SubscriptionPlanListResponseDto })
  async findAll(@Query() pagination: PaginationDto): Promise<SubscriptionPlanListResponseDto> {
    const result = await this.plansService.findAllWithCache(
      pagination.limit,
      pagination.offset,
      // По умолчанию сервис фильтрует по ACTIVE, можно не передавать
    );
    return SubscriptionPlanMapper.toListResponseDto(
      result.plans,
      result.total,
      result.limit,
      result.offset,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить тарифный план по ID',
    description: 'Возвращает детальную информацию о плане. Доступно без авторизации.',
  })
  @ApiParam({ name: 'id', description: 'ID тарифного плана', type: Number })
  @ApiOkResponse({ description: 'Детальная информация о плане', type: SubscriptionPlanDetailResponseDto })
  @ApiNotFoundResponse({ description: 'План не найден' })
  async findOne(@Param('id') planId: string): Promise<SubscriptionPlanDetailResponseDto> {
    const plan = await this.plansService.findByIdWithCache(Number(planId));
    return SubscriptionPlanMapper.toDetailResponseDto(plan);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создать новый тарифный план',
    description: 'Доступно только администраторам.',
  })
  @ApiBody({ type: CreateSubscriptionPlanDto, description: 'Данные для создания плана' })
  @ApiCreatedResponse({ description: 'План успешно создан', type: SubscriptionPlanDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiConflictResponse({ description: 'План с таким названием уже существует' })
  async create(@Body() dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanDetailResponseDto> {
    const plan = await this.plansService.create(dto);
    return SubscriptionPlanMapper.toDetailResponseDto(plan);
  }

  @Patch(':id/info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновить информацию о тарифном плане (кроме статуса)',
    description: 'Доступно только администраторам.',
  })
  @ApiParam({ name: 'id', description: 'ID тарифного плана', type: Number })
  @ApiBody({ type: UpdateSubscriptionPlanInfoDto, description: 'Обновляемые поля' })
  @ApiOkResponse({ description: 'План обновлён', type: SubscriptionPlanDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiNotFoundResponse({ description: 'План не найден' })
  @ApiConflictResponse({ description: 'План с таким названием уже существует (если name изменён и конфликтует)' })
  async updateInfo(
    @Param('id') planId: string,
    @Body() dto: UpdateSubscriptionPlanInfoDto,
  ): Promise<SubscriptionPlanDetailResponseDto> {
    const plan = await this.plansService.update(Number(planId), dto);
    return SubscriptionPlanMapper.toDetailResponseDto(plan);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Изменить статус тарифного плана',
    description: 'Доступно только администраторам.',
  })
  @ApiParam({ name: 'id', description: 'ID тарифного плана', type: Number })
  @ApiBody({ type: UpdateSubscriptionPlanStatusDto, description: 'Новый статус' })
  @ApiOkResponse({ description: 'Статус обновлён', type: SubscriptionPlanDetailResponseDto })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  @ApiNotFoundResponse({ description: 'План не найден' })
  async updateStatus(
    @Param('id') planId: string,
    @Body() dto: UpdateSubscriptionPlanStatusDto,
  ): Promise<SubscriptionPlanDetailResponseDto> {
    const plan = await this.plansService.update(Number(planId), { status: dto.status });
    return SubscriptionPlanMapper.toDetailResponseDto(plan);
  }
}
