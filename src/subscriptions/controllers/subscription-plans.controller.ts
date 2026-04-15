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
  @ApiOperation({ summary: 'Получить все активные тарифные планы' })
  @ApiOkResponse({ type: SubscriptionPlanListResponseDto, description: 'Список планов' })
  async findAll(@Query() pagination: PaginationDto): Promise<SubscriptionPlanListResponseDto> {
    const result = await this.plansService.findAllWithCache(pagination.limit, pagination.offset);
    return SubscriptionPlanMapper.toListResponseDto(
      result.plans,
      result.total,
      result.limit,
      result.offset,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить тарифный план по ID' })
  @ApiParam({ type: Number, name: 'id', description: 'ID тарифного плана' })
  @ApiOkResponse({ type: SubscriptionPlanDetailResponseDto, description: 'Детальная информация о плане' })
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
  @ApiOperation({ summary: 'Создать новый тарифный план' })
  @ApiCreatedResponse({ type: SubscriptionPlanDetailResponseDto, description: 'План успешно создан' })
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
  @ApiOperation({ summary: 'Обновить информацию о тарифном плане' })
  @ApiParam({ type: Number, name: 'id', description: 'ID тарифного плана' })
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
  @ApiOkResponse({ type: SubscriptionPlanDetailResponseDto, description: 'Статус обновлён' })
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
