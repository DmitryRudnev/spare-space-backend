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
} from '@nestjs/swagger';

import { UsersService } from './services/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { UpdateBanStatusDto, UpdateVerifiedStatusDto } from './dto/requests/update-status.dto';

@ApiTags('Admin / Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleType.ADMIN)
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Заблокировать/разблокировать пользователя' })
  @ApiOkResponse({ description: 'Статус блокировки изменен' })
  async updateBanStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBanStatusDto,
  ): Promise<void> {
    await this.usersService.updateBanStatus(id, dto.isBanned);
  }

  @Patch(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Изменить статус верификации пользователя' })
  @ApiOkResponse({ description: 'Статус верификации изменен' })
  async updateVerifiedStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVerifiedStatusDto,
  ): Promise<void> {
    await this.usersService.updateVerifiedStatus(id, dto.verified);
  }
}
