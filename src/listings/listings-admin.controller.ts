import {
  Controller,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { UpdateListingStatusDto } from './dto/requests/update-listing-status.dto';

@ApiTags('Admin / Listings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleType.ADMIN)
@Controller('admin/listings')
export class ListingsAdminController {
  constructor(private readonly listingsService: ListingsService) {}

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Модерация: изменение статуса объявления' })
  @ApiOkResponse({ description: 'Статус успешно изменен' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован или нет прав администратора' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateListingStatusDto,
  ): Promise<void> {
    await this.listingsService.updateStatus(id, dto.status);
  }
}
