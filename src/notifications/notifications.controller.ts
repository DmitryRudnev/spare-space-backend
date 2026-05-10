import { Controller, Get, Body, Param, Query, UseGuards, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiOkResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { NotificationsService } from './services/notifications.service';
import { SearchNotificationsDto } from './dto/requests/search-notifications.dto';
import { MarkAsReadDto } from './dto/requests/mark-as-read.dto';
import { NotificationResponseDto } from './dto/responses/notification-response.dto';
import { NotificationListResponseDto } from './dto/responses/notification-list-response.dto';
import { NotificationMapper } from './mappers/notification.mapper';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить список уведомлений текущего пользователя' })
  @ApiOkResponse({ type: NotificationListResponseDto, description: 'Список уведомлений' })
  async findAll(
    @Query() searchDto: SearchNotificationsDto, 
    @User('userId') userId: number
  ): Promise<NotificationListResponseDto> {
    const { notifications, total, limit, offset } = await this.notificationsService.findAll(userId, searchDto);
    return NotificationMapper.toListResponseDto(notifications, total, limit, offset);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить информацию об уведомлении' })
  @ApiParam({ type: Number, name: 'id', description: 'ID уведомления', example: 1 })
  @ApiOkResponse({ type: NotificationResponseDto, description: 'Данные уведомления' })
  @ApiNoContentResponse({ description: 'Уведомление не найдено' })
  async findById(
    @Param('id') id: string,
    @User('userId') userId: number,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.findById(+id, userId);
    return NotificationMapper.toResponseDto(notification);
  }
  
  @Patch('read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Пометить уведомление (и дополнительные ID) как прочитанные' })
  @ApiNoContentResponse({ description: 'Статус успешно обновлен' })
  async markAsRead(
    @User('userId') userId: number,
    @Body() dto: MarkAsReadDto,
  ): Promise<void> {
    await this.notificationsService.markAsRead(userId, dto.ids);
  }
}
