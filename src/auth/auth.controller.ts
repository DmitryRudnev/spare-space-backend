import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiNoContentResponse, ApiUnauthorizedResponse, ApiBadRequestResponse, ApiConflictResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/requests/login.dto';
import { RegisterDto } from './dto/requests/register.dto';
import { TokenOperationDto } from './dto/requests/token-operation.dto';
import { CheckPhoneDto } from './dto/requests/check-phone.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { LoginResponseDto } from './dto/responses/login-response.dto';
import { VerifyTwoFactorDto } from './dto/requests/verify-two-factor.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Регистрация пользователя',
    description: 'Создает нового пользователя и возвращает токены доступа'
  })
  @ApiBody({ type: RegisterDto, description: 'Данные для регистрации' })
  @ApiCreatedResponse({ 
    description: 'Пользователь успешно зарегистрирован', 
    type: AuthResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  @ApiConflictResponse({ description: 'Email или телефон уже существуют' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Вход в систему',
    description: 'Аутентификация пользователя по email/телефону и паролю'
  })
  @ApiBody({ type: LoginDto, description: 'Данные для входа' })
  @ApiOkResponse({ 
    description: 'Успешная аутентификация', 
    type: LoginResponseDto 
  })
  @ApiUnauthorizedResponse({ description: 'Неверные учетные данные' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('verify-2fa')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Подтверждение двухфакторной аутентификации',
    description: 'Завершает вход с 2FA и возвращает токены доступа'
  })
  @ApiBody({ type: VerifyTwoFactorDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Неверный код или токен' })
  async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto): Promise<AuthResponseDto> {
    return this.authService.verifyTwoFactor(dto.twoFactorToken, dto.code);
  }

  @Post('check-phone-login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Проверка телефона для входа',
    description: 'Проверяет, существует ли пользователь с указанным телефоном'
  })
  @ApiBody({ type: CheckPhoneDto, description: 'Телефон для проверки' })
  @ApiOkResponse({ 
    description: 'Результат проверки телефона',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', example: true }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Некорректный номер телефона' })
  async checkPhoneLogin(@Body() dto: CheckPhoneDto): Promise<{ exists: boolean }> {
    return this.authService.checkPhoneExists(dto.phone);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Обновление токенов',
    description: 'Обновляет access и refresh токены'
  })
  @ApiBody({ type: TokenOperationDto, description: 'Refresh токен' })
  @ApiOkResponse({ 
    description: 'Токены успешно обновлены', 
    type: AuthResponseDto 
  })
  @ApiUnauthorizedResponse({ description: 'Неверный или просроченный токен' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async refresh(@Body() dto: TokenOperationDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Выход из системы',
    description: 'Инвалидирует refresh токен'
  })
  @ApiBody({ type: TokenOperationDto, description: 'Refresh токен для инвалидации' })
  @ApiNoContentResponse({ description: 'Успешный выход из системы' })
  @ApiUnauthorizedResponse({ description: 'Неверный токен' })
  @ApiConflictResponse({ description: 'Токен уже отозван' })
  async logout(@Body() dto: TokenOperationDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }
}
