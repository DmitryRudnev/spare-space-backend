import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
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
import { RequestSmsCodeDto } from './dto/requests/request-sms-code.dto';
import { VerifySmsCodeDto } from './dto/requests/verify-sms-code.dto';
import { CompleteRegistrationDto } from './dto/requests/complete-registration.dto';
import { VerifySmsCodeResponseDto } from './dto/responses/verify-sms-code-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-sms-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Запрос SMS-кода для входа/регистрации' })
  @ApiOkResponse({ description: 'Код отправлен' })
  async requestSmsCode(@Body() dto: RequestSmsCodeDto): Promise<void> {
    await this.authService.requestSmsCode(dto.phone);
  }

  @Post('verify-sms-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Подтверждение кода' })
  @ApiOkResponse({
    type: VerifySmsCodeResponseDto,
    description: 'Вход выполнен успешно ИЛИ требуется завершение регистрации ИЛИ требуется подтверждение 2ФА',
  })
  @ApiUnauthorizedResponse({ description: 'Неверный или просроченный код' })
  async verifySmsCode(@Body() dto: VerifySmsCodeDto): Promise<VerifySmsCodeResponseDto> {
    return this.authService.verifySmsCode(dto.phone, dto.code);
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
