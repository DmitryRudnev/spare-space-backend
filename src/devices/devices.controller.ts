import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  Delete,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { UpdateDeviceDto } from './dto/update-device.dto';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Регистрация или обновление токена устройства',
    description: 'Сохраняет FCM токен для текущего пользователя. Вызывается фронтендом при запуске приложения'
  })
  @ApiOkResponse({ description: 'Токен успешно сохранен' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async updateDevice(
    @User('userId') userId: number,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ): Promise<void> {
    await this.devicesService.upsertDevice(userId, updateDeviceDto);    
  }

  @Delete(':fcmToken')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удаление токена устройства',
    description: 'Удаляет FCM токен для текущего пользователя. Вызывается фронтендом при выходе из аккаунта или при удалении приложения'
  })
  @ApiNoContentResponse({ description: 'Токен успешно удален' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async deleteDevice(
    @Param('fcmToken') fcmToken: string,
    @User('userId') userId: number,
  ): Promise<void> {
    await this.devicesService.deleteDevice(userId, fcmToken);
  }
}
