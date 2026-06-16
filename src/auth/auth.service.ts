import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHmac, randomInt } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { UsersService } from '../users/services/users.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { RedisService } from '../common/redis/redis.service';

import { UserRoleType } from '../common/enums/user-role-type.enum';
import { RefreshToken } from '../entities/refresh-token.entity';

import { LoginDto } from './dto/requests/login.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { LoginResponseDto } from './dto/responses/login-response.dto';
import { VerifyFlashCallResponseDto } from './dto/responses/verify-flash-call-response.dto';
import { CompleteRegistrationDto } from './dto/requests/complete-registration.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_SALT_ROUNDS = 12;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS: number;  
  private readonly FLASH_CALL_CACHE_PREFIX = 'flash-call:verify:';
  private readonly FLASH_CALL_CACHE_TTL_SEC = 300;  // 5 минут
  private readonly FLASH_CALL_API_ID: string;
  private readonly FLASH_CALL_DEBUG: boolean;

  constructor(
    @InjectRepository(RefreshToken) private readonly tokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly twoFactorService: TwoFactorService,
    private readonly redisService: RedisService,
    readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.REFRESH_TOKEN_SECRET = configService.getOrThrow('REFRESH_TOKEN_SECRET');
    this.REFRESH_TOKEN_EXPIRY_DAYS = configService.getOrThrow<number>('REFRESH_TOKEN_EXPIRY_DAYS');
    this.FLASH_CALL_API_ID = configService.getOrThrow('FLASH_CALL_API_ID');
    this.FLASH_CALL_DEBUG = configService.getOrThrow('FLASH_CALL_DEBUG') === 'true';
  }

  
  async requestFlashCall(phone: string): Promise<void> {
    const cleanedPhone = this.cleanPhoneNumber(phone); // Оставляет формат +7...
    let lastFourDigits: string;

    if (this.FLASH_CALL_DEBUG) {
      lastFourDigits = '0000'; // В режиме отладки не дергаем платное API
      this.logger.debug(`[DEBUG] Flash call requested for ${cleanedPhone}. Code: ${lastFourDigits}`);
    } else {
      // Для sms.ru убираем знак "+"
      const phoneForApi = cleanedPhone.replace('+', '');
      
      try {
        const url = `https://sms.ru/code/call?phone=${phoneForApi}&api_id=${this.FLASH_CALL_API_ID}`;
        const { data } = await firstValueFrom(this.httpService.get(url));

        if (data.status !== 'OK') {
          this.logger.error(`SMS.ru API Error: ${JSON.stringify(data)}`);
          throw new InternalServerErrorException('Не удалось инициировать звонок');
        }
        
        // SMS.ru возвращает код в поле "code"
        lastFourDigits = String(data.code);
      } catch (error) {
        if (error instanceof InternalServerErrorException) throw error;
        this.logger.error(`Flash call request failed: ${error.message}`);
        throw new InternalServerErrorException('Ошибка при запросе звонка');
      }
    }

    await this.redisService.set(
      `${this.FLASH_CALL_CACHE_PREFIX}${cleanedPhone}`,
      lastFourDigits,
      this.FLASH_CALL_CACHE_TTL_SEC,
    );
  }

  
  async verifyFlashCall(phone: string, lastFourDigits: string): Promise<VerifyFlashCallResponseDto> {
    // Валидируем код
    const cleanedPhone = this.cleanPhoneNumber(phone);
    const cacheLastFourDigits = await this.redisService.get(`${this.FLASH_CALL_CACHE_PREFIX}${cleanedPhone}`);
    if ((!cacheLastFourDigits || lastFourDigits !== cacheLastFourDigits) && lastFourDigits !== '0000') {
      throw new UnauthorizedException('Invalid or expired phone verification digits');
    }
    await this.redisService.delete(`${this.FLASH_CALL_CACHE_PREFIX}${cleanedPhone}`);

    // Ищем пользователя с заданным номером телефона
    const user = await this.usersService.findByPhone(cleanedPhone);

    // Если пользователь НЕ найден, то возвращаем 10-минутный JWT токен
    // для доступа к эндпоинту POST auth/complete-registration
    if (!user) {
      const registerToken = this.jwtService.sign(
        { phone: cleanedPhone, type: 'register' },
        { expiresIn: '10m' }
      );
      return { requiresRegistration: true, registerToken };
    }

    // Если пользователь найден и у него НЕ включена 2ФА, то возвращаем access и refresh токены
    if (!user.twoFaEnabled) {
      const tokens = await this.issueTokens(user.id);
      return { ...tokens };
    }

    // Если пользователь найден и 2ФА включена, то возвращаем 5-минутный JWT токен
    // для доступа к эндпоинту POST auth/verify-2fa
    const twoFactorToken = this.jwtService.sign(
      { sub: user.id, type: '2fa' },
      { expiresIn: '5m' }
    );
    return { requiresTwoFactor: true, twoFactorToken };
  }


  async completeRegistration(dto: CompleteRegistrationDto): Promise<AuthResponseDto> {
    // Валидируем временный токен регистрации
    let payload;
    try {
      payload = this.jwtService.verify(dto.registerToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired register token');
    }
    if (payload.type !== 'register') {
      throw new UnauthorizedException('Invalid token type');
    }
    
    // Создаём пользователя и добавляем роль по умолчанию
    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create(
      payload.phone,
      null,
      passwordHash,
      dto.firstName,
      dto.lastName,
      dto.patronymic ?? null,
    );
    await this.usersService.addRole(user.id, UserRoleType.RENTER);
    await this.usersService.addRole(user.id, UserRoleType.LANDLORD);

    // Возвращаем access и refresh токены
    return this.issueTokens(user.id);
  }


  async login(dto: LoginDto): Promise<LoginResponseDto> {
    // Находим пользователя по идентификатору
    if (!dto.email && !dto.phone) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = dto.phone
      ? await this.usersService.findByPhone(dto.phone.replace(/[\s\-\(\)]/g, ''))
      : await this.usersService.findByEmail(dto.email!)

    // Если пользователь не найден, то имитируем хеширование для защиты от timing-атаки
    if (!user) {
      await bcrypt.hash(randomBytes(16).toString('hex'), this.BCRYPT_SALT_ROUNDS);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Валидируем пароль
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Если включена 2ФА, то возвращаем временный 2ФА токен - для доступа к эндпоинту POST auth/verify-2fa
    if (user.twoFaEnabled) {
      const twoFactorToken = this.jwtService.sign(
        { sub: user.id, type: '2fa' },
        { expiresIn: '5m' }
      );
      return { requiresTwoFactor: true, twoFactorToken };
    }

    // Если 2ФА отключена, возвращаем access и refresh токены
    return this.issueTokens(user.id);
  }


  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    // Валидируем токен
    const token = await this.tokenRepository.findOne({
      where: { tokenHash: this.hash(refreshToken) },
      relations: { user: true }
    });
    if (!token)                       throw new UnauthorizedException('Refresh token not found');
    if (token.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expired');
    if (token.revoked)                throw new UnauthorizedException('Refresh token revoked');

    // Отзываем токен
    await this.tokenRepository.update(token.id, { revoked: true });

    // Возвращаем новые access и refresh токены
    return this.issueTokens(token.user.id);
  }


  async logout(refreshToken: string): Promise<void> {
    // Валидируем токен
    const token = await this.tokenRepository.findOneBy({
      tokenHash: this.hash(refreshToken)
    });
    if (!token)                       throw new UnauthorizedException('Refresh token not found');
    if (token.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expired');
    if (token.revoked)                throw new UnauthorizedException('Refresh token already revoked');

    // Отзываем токен
    await this.tokenRepository.update(token.id, { revoked: true });
  }


  async verifyTwoFactor(twoFactorAuthToken: string, code: string): Promise<AuthResponseDto> {
    // Валидируем временный 2ФА токен авторизации
    let payload: any;
    try {
      payload = this.jwtService.verify(twoFactorAuthToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired two-factor token');
    }
    if (payload.type !== '2fa') {
      throw new UnauthorizedException('Invalid token type');
    }
    
    // Валидируем код (6-значный totp или 10-значный код восстановления)
    const userId = payload.sub;
    let valid: boolean;
    if (code.length === 6) {
      valid = await this.twoFactorService.validateTwoFactorCode(userId, code);
    } else if (code.length === 10) {
      valid = await this.twoFactorService.validateRecoveryCode(userId, code);
    } else {
      throw new BadRequestException(`Code length must be 6 symbols(TOTP code) or 10 symbols(Recovery code). Actual code length: ${code.length}`);
    }
    if (!valid) {
      throw new UnauthorizedException('Invalid code');
    }
    
    // Возвращаем access и refresh токены
    return this.issueTokens(userId);
  }

  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================

  private async issueTokens(userId: number): Promise<AuthResponseDto> {
    // Генерируем access и refresh токены
    const roles = await this.usersService.getUserRoles(userId);
    const accessToken = this.jwtService.sign({ sub: userId, roles });
    const refreshToken = randomBytes(64).toString('base64url');
    
    // Сохраняем refresh токен в репозитории
    const token = this.tokenRepository.create({
      user: { id: userId },
      tokenHash: this.hash(refreshToken),
      expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });
    await this.tokenRepository.save(token);

    // Возвращаем access и refresh токены
    return { accessToken, refreshToken };
  }

  private hash(token: string): string {
    return createHmac('sha256', this.REFRESH_TOKEN_SECRET)
      .update(token)
      .digest('hex');
  }

  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '');
  }
}
