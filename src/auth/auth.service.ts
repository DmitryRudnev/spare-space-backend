import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/services/users.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { User } from '../entities/user.entity';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { RefreshToken } from '../entities/refresh-token.entity';

import { RegisterDto } from './dto/requests/register.dto';
import { LoginDto } from './dto/requests/login.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { LoginResponseDto } from './dto/responses/login-response.dto';

/**
 * Service responsible for authentication-related operations
 * @class
 * @public
 */
@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT_ROUNDS = 12;

  /**
   * Creates an instance of AuthService
   * @param userRepository - Repository for User entity
   * @param tokenRepository - Repository for UserToken entity  
   * @param jwtService - Service for JWT operations
   * @param configService - Service for configuration management
   * @param userService - Service for user management
   */
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken) private readonly tokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  /**
   * Registers a new user
   * @param dto - Registration data
   * @returns Authentication tokens
   * @throws {ConflictException} If email or phone already exists
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    await this.validateUniqueness(dto.phone, dto.email);
    const user = await this.createUserWithRole(dto);
    return this.issueTokens(user.id);
  }

  /**
   * Authenticates a user
   * @param dto - Login credentials
   * @returns Authentication tokens
   * @throws {UnauthorizedException} If credentials are invalid
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateCredentials(dto);

    if (user.twoFaEnabled) {
      const twoFactorToken = this.generateTwoFactorToken(user.id);
      return {
        requiresTwoFactor: true,
        twoFactorToken,
      };
    }

    return this.issueTokens(user.id);
  }

  async verifyTwoFactor(twoFactorToken: string, code: string): Promise<AuthResponseDto> {
    if (code.length !== 6 && code.length !== 10) {
      throw new BadRequestException(`Code length must be 6 symbols(TOTP code) or 10 symbols(Recovery code). Actual code length: ${code.length}`);
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(twoFactorToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired two-factor token');
    }
    
    if (payload.type !== '2fa') {
      throw new UnauthorizedException('Invalid token type');
    }
    
    const userId = payload.sub;
    
    const isTotpValid = await this.twoFactorService.validateTwoFactorCode(userId, code);
    const isRecoveryValid = await this.twoFactorService.validateRecoveryCode(userId, code);
    if (!isTotpValid && !isRecoveryValid) {
      throw new UnauthorizedException('Invalid code');
    }
    
    return this.issueTokens(userId);
  }

  /**
   * Checks if a phone number is registered for login
   * @param phone - Phone number to check
   * @returns Object indicating if phone exists
   */
  async checkPhoneLogin(phone: string): Promise<{ exists: boolean }> {
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const user = await this.userRepository.findOneBy({ phone: cleanedPhone });
    return { exists: !!user };
  }

  /**
   * Refreshes authentication tokens
   * @param refreshToken - Refresh token string
   * @returns New authentication tokens
   * @throws {UnauthorizedException} If refresh token is invalid or expired
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const tokenEntity = await this.validateRefreshToken(refreshToken);
    await this.revokeToken(tokenEntity.id);
    return this.issueTokens(tokenEntity.user.id);
  }

  /**
   * Logs out a user by revoking refresh token
   * @param refreshToken - Refresh token string
   * @throws {UnauthorizedException} If refresh token not found
   * @throws {ConflictException} If refresh token already revoked
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenEntity = await this.findValidToken(refreshToken);
    if (!tokenEntity) {
      throw new UnauthorizedException('Refresh token not found');
    }
    if (tokenEntity.revoked) {
      throw new ConflictException('Refresh token already revoked');
    }
    await this.revokeToken(tokenEntity.id);
  }

  /**
   * Validates registration data for uniqueness
   * @param dto - Registration data
   * @throws {ConflictException} If email or phone already exists
   * @private
   */
  private async validateUniqueness(phone: string, email: string): Promise<void> {
    const [emailExists, phoneExists] = await Promise.all([
      this.userRepository.existsBy({ phone }),
      this.userRepository.existsBy({ email }),
    ]);
    if (emailExists) {
      throw new ConflictException('Email already exists');
    }
    if (phoneExists) {
      throw new ConflictException('Phone already exists');
    }
  }

  /**
   * Validates user credentials
   * @param dto - Login credentials
   * @returns User entity if credentials are valid
   * @throws {UnauthorizedException} If credentials are invalid
   * @private
   */
  private async validateCredentials(dto: LoginDto): Promise<User> {
    const user = await this.findUserByIdentifier(dto);
    if (!user) {  // Fake hash to prevent timing attacks
      await bcrypt.hash(crypto.randomBytes(16).toString('hex'), this.BCRYPT_SALT_ROUNDS);
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  /**
   * Creates a new user with RENTER role
   * @param dto - Registration data
   * @returns Created user entity
   * @private
   */
  private async createUserWithRole(dto: RegisterDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      email: dto.email,
      phone: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      patronymic: dto.patronymic,
      passwordHash,
      rating: 0
    });
    const savedUser = await this.userRepository.save(user);
    await this.userService.addRole(savedUser.id, UserRoleType.RENTER);
    return savedUser;
  }

  /**
   * Finds user by email or phone identifier
   * @param dto - Login credentials containing email or phone
   * @returns User entity or null if not found
   * @private
   */
  private async findUserByIdentifier(dto: LoginDto): Promise<User | null> {
    const where = dto.email ? { email: dto.email } : { phone: dto.phone };
    return this.userRepository.findOneBy(where);
  }

  /**
   * Issues new authentication tokens
   * @param userId - User identifier
   * @returns Authentication tokens
   * @private
   */
  private async issueTokens(userId: number): Promise<AuthResponseDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId),
      this.generateRefreshToken()
    ]);
    await this.saveRefreshToken(userId, refreshToken);
    return { accessToken, refreshToken };
  }

  /**
   * Generates access token with user roles
   * @param userId - User identifier
   * @returns JWT access token
   * @private
   */
  private async generateAccessToken(userId: number): Promise<string> {
    const roles = await this.userService.getUserRoles(userId);
    const payload = { sub: userId, roles };
    return this.jwtService.sign(payload);
  }

  private generateTwoFactorToken(userId: number): string {
    const payload = { sub: userId, type: '2fa' };
    return this.jwtService.sign(payload, { expiresIn: '5m' });
  }

  /**
   * Generates cryptographically secure refresh token
   * @returns Refresh token string
   * @private
   */
  private async generateRefreshToken(): Promise<string> {
    return crypto.randomBytes(64).toString('base64url');
  }

  /**
   * Saves hashed refresh token to database
   * @param userId - User identifier
   * @param refreshToken - Refresh token string
   * @private
   */
  private async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const expiry = new Date(Date.now() + this.getRefreshTokenExpiryMs());
    const tokenEntity = this.tokenRepository.create({
      user: { id: userId },
      tokenHash: refreshTokenHash,
      expiresAt: expiry,
      revoked: false
    });
    await this.tokenRepository.save(tokenEntity);
  }

  /**
   * Validates refresh token and returns token entity
   * @param refreshToken - Refresh token string
   * @returns Valid UserToken entity
   * @throws {UnauthorizedException} If token is invalid, expired or revoked
   * @private
   */
  private async validateRefreshToken(refreshToken: string): Promise<RefreshToken> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const tokenEntity = await this.tokenRepository.findOne({
      where: { tokenHash: refreshTokenHash },
      relations: ['user']
    });
    if (!tokenEntity || tokenEntity.expiresAt < new Date() || tokenEntity.revoked) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return tokenEntity;
  }

  /**
   * Finds valid token entity by refresh token
   * @param refreshToken - Refresh token string
   * @returns UserToken entity or null if not found
   * @private
   */
  private async findValidToken(refreshToken: string): Promise<RefreshToken | null> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    return this.tokenRepository.findOneBy({ tokenHash: refreshTokenHash });
  }

  /**
   * Hashes refresh token using HMAC-SHA256
   * @param refreshToken - Refresh token string
   * @returns Hashed token string
   * @private
   */
  private hashRefreshToken(refreshToken: string): string {
    const refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
    return crypto
      .createHmac('sha256', refreshTokenSecret)
      .update(refreshToken)
      .digest('hex');
  }

  /**
   * Gets refresh token expiry time in milliseconds
   * @returns Expiry time in milliseconds
   * @private
   */
  private getRefreshTokenExpiryMs(): number {
    const days = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7);
    return days * 24 * 60 * 60 * 1000;
  }

  /**
   * Revokes a token by marking it as revoked
   * @param tokenId - Token identifier
   * @private
   */
  private async revokeToken(tokenId: number): Promise<void> {
    await this.tokenRepository.update(tokenId, { revoked: true });
  }
}
