import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/requests/login.dto';
import { TokenOperationDto } from './dto/requests/token-operation.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { LoginResponseDto } from './dto/responses/login-response.dto';
import { VerifyTwoFactorDto } from './dto/requests/verify-two-factor.dto';
import { RequestFlashCallDto } from './dto/requests/request-flash-call.dto';
import { VerifyFlashCallDto } from './dto/requests/verify-phone-call.dto';
import { CompleteRegistrationDto } from './dto/requests/complete-registration.dto';
import { VerifyFlashCallResponseDto } from './dto/responses/verify-flash-call-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-flash-call')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Запрос звонка-сброса для входа/регистрации' })
  @ApiOkResponse({ description: 'Звонок успешно заказан' })
  async requestFlashCall(@Body() dto: RequestFlashCallDto): Promise<void> {
    await this.authService.requestFlashCall(dto.phone);
  }

  @Post('verify-flash-call')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Подтверждение номера телефона по звонку-сбросу' })
  @ApiOkResponse({
    type: VerifyFlashCallResponseDto,
    description: 'Вход выполнен успешно ИЛИ требуется завершение регистрации ИЛИ требуется подтверждение 2ФА',
  })
  @ApiUnauthorizedResponse({ description: 'Неверные цифры звонившего номера или сессия истекла' })
  async verifyFlashCall(@Body() dto: VerifyFlashCallDto): Promise<VerifyFlashCallResponseDto> {
    return this.authService.verifyFlashCall(dto.phone, dto.lastFourDigits);
  }

  @Post('complete-registration')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Завершение регистрации' })
  @ApiCreatedResponse({ type: AuthResponseDto, description: 'Регистрация успешно завершена' })
  @ApiConflictResponse({ description: 'Телефон уже существует' })
  @ApiUnauthorizedResponse({ description: 'Неверный или просроченный токен' })
  async completeRegistration(@Body() dto: CompleteRegistrationDto): Promise<AuthResponseDto> {
    return this.authService.completeRegistration(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход по телефону/почте и паролю' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Вход выполнен успешно ИЛИ требуется подтверждение 2ФА' })
  @ApiUnauthorizedResponse({ description: 'Неверные учетные данные' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Подтверждение двухфакторной аутентификации' })
  @ApiOkResponse({ type: AuthResponseDto, description: '2ФА успешно подтверждена' })
  @ApiUnauthorizedResponse({ description: 'Неверный код или токен' })
  async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto): Promise<AuthResponseDto> {
    return this.authService.verifyTwoFactor(dto.twoFactorToken, dto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление access и refresh токенов' })
  @ApiOkResponse({ type: AuthResponseDto, description: 'Токены успешно обновлены' })
  @ApiUnauthorizedResponse({ description: 'Неверный или просроченный токен' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async refresh(@Body() dto: TokenOperationDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Выход из системы' })
  @ApiNoContentResponse({ description: 'Успешный выход из системы' })
  @ApiUnauthorizedResponse({ description: 'Неверный токен' })
  @ApiConflictResponse({ description: 'Токен уже отозван' })
  async logout(@Body() dto: TokenOperationDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }
}
