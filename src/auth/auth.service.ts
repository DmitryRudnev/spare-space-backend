import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/services/users.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { RefreshToken } from '../entities/refresh-token.entity';

import { RegisterDto } from './dto/requests/register.dto';
import { LoginDto } from './dto/requests/login.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { LoginResponseDto } from './dto/responses/login-response.dto';

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT_ROUNDS = 12;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS: number;  

  constructor(
    @InjectRepository(RefreshToken) private readonly tokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly twoFactorService: TwoFactorService,
    configService: ConfigService,
  ) {
    this.REFRESH_TOKEN_SECRET = configService.getOrThrow('REFRESH_TOKEN_SECRET');
    this.REFRESH_TOKEN_EXPIRY_DAYS = configService.getOrThrow<number>('REFRESH_TOKEN_EXPIRY_DAYS');
  }

  // ==========================================================================
  // ========================== CONTROLLER HANDLERS ===========================
  // ==========================================================================

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Проверяем уникальность телефона и почты
    const [phoneExists, emailExists] = await Promise.all([
      this.usersService.existsByPhone(dto.phone),
      this.usersService.existsByEmail(dto.email),
    ]);
    if (phoneExists) throw new ConflictException('Phone already exists');
    if (emailExists) throw new ConflictException('Email already exists');
    
    // Создаём пользователя и добавляем роль по умолчанию
    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create(
      dto.firstName,
      dto.lastName,
      dto.phone.replace(/[\s\-\(\)]/g, ''),
      dto.email,
      passwordHash,
      dto.patronymic,
    );
    await this.usersService.addRole(user.id, UserRoleType.RENTER);

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
      await bcrypt.hash(crypto.randomBytes(16).toString('hex'), this.BCRYPT_SALT_ROUNDS);
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

    // Возвращаем access и refresh токены
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

  async checkPhoneExists(phone: string): Promise<{ exists: boolean }> {
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const exists = await this.usersService.existsByPhone(cleanedPhone);
    return { exists };
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
    const refreshToken = crypto.randomBytes(64).toString('base64url');
    
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
    return crypto
      .createHmac('sha256', this.REFRESH_TOKEN_SECRET)
      .update(token)
      .digest('hex');
  }
}
