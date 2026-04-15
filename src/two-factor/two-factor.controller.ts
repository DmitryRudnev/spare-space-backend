import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { TwoFactorService } from './two-factor.service';
import { UsersService } from '../users/services/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

import { EnableTwoFactorRequestDto } from './dto/requests/enable-two-factor-request.dto';
import { DisableTwoFactorRequestDto } from './dto/requests/disable-two-factor-request.dto';
import { GenerateSecretResponseDto } from './dto/responses/generate-secret-response.dto';
import { EnableTwoFactorResponseDto } from './dto/responses/enable-two-factor-response.dto';
import { TwoFactorStatusResponseDto } from './dto/responses/two-factor-status-response.dto';

@ApiTags('two-factor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('2fa')
export class TwoFactorController {
  constructor(
    private readonly twoFactorService: TwoFactorService,
    private readonly usersService: UsersService,
  ) {}

  @Get('generate')
  @ApiOperation({ summary: 'Сгенерировать временный TOTP секрет для включения 2FA' })
  @ApiOkResponse({ type: GenerateSecretResponseDto, description: 'Секрет успешно сгенерирован' })
  @ApiBadRequestResponse({ description: '2FA уже включена' })
  async generate(@User('userId') userId: number): Promise<GenerateSecretResponseDto> {
    return this.twoFactorService.generateSecret(userId);
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Включить двухфакторную аутентификацию для пользователя' })
  @ApiOkResponse({ type: EnableTwoFactorResponseDto, description: '2FA включена, возвращены коды восстановления' })
  @ApiBadRequestResponse({ description: 'Неверный код или нет временного секрета' })
  async enable(
    @User('userId') userId: number,
    @Body() dto: EnableTwoFactorRequestDto,
  ): Promise<EnableTwoFactorResponseDto> {
    const { recoveryCodes } = await this.twoFactorService.enableTwoFactor(userId, dto.code);
    return { recoveryCodes };
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отключить двухфакторную аутентификацию' })
  @ApiOkResponse({ description: '2FA отключена' })
  @ApiBadRequestResponse({ description: '2FA не включена' })
  @ApiUnauthorizedResponse({ description: 'Неверный код' })
  async disable(
    @User('userId') userId: number,
    @Body() dto: DisableTwoFactorRequestDto,
  ): Promise<void> {
    await this.twoFactorService.disableTwoFactor(userId, dto.code);
  }

  @Get('status')
  @ApiOperation({ summary: 'Получить текущий статус 2FA для пользователя' })
  @ApiOkResponse({ type: TwoFactorStatusResponseDto, description: 'Статус получен' })
  async status(@User('userId') userId: number): Promise<TwoFactorStatusResponseDto> {
    const enabled = (await this.usersService.findById(userId)).twoFaEnabled;
    return { enabled };
  }
}
