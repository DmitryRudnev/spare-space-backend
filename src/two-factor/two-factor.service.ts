import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verify } from 'otplib';
import * as bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

import { UsersService } from '../users/services/users.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class TwoFactorService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly saltRounds = 10;
  private readonly appName: string;
  private readonly recoveryCodesCount = 10;
  private readonly recoveryCodeLength = 10; // hex chars
  private readonly TEMP_2FA_SECRET_PREFIX = '2fa:temp:';
  private readonly TEMP_2FA_SECRET_TTL_SEC = 3600; // 1 час

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    const secret = this.configService.get<string>('TWO_FA_ENCRYPTION_SECRET');
    if (!secret) {
      throw new Error('TWO_FA_ENCRYPTION_SECRET is missing in configuration');
    }
    this.key = scryptSync(secret, 'salt', 32);
    this.appName = this.configService.getOrThrow<string>('APP_NAME');
  }

  /**
   * Generates a temporary TOTP secret for a user.
   * Returns the secret (base32) and the otpauth URL.
   * The secret is stored in twoFaTempSecret.
   */
  async generateSecret(userId: number): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.usersService.findById(userId);

    if (user.twoFaEnabled) {
      throw new BadRequestException('2FA is already enabled for this user');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({ 
      issuer: this.appName,
      secret,
      label: user.email
    });

    // Save temporary secret (plaintext - will be used for verification before enabling)
    await this.redisService.set(
      `${this.TEMP_2FA_SECRET_PREFIX}${userId}`,
      secret,
      this.TEMP_2FA_SECRET_TTL_SEC
    );

    return { secret, otpauthUrl };
  }

  /**
   * Enables 2FA for a user after verifying the provided TOTP code.
   * The temporary secret is encrypted and stored permanently.
   * Recovery codes are generated, hashed, and stored.
   * Returns the plain recovery codes (to be shown to the user once).
   */
  async enableTwoFactor(userId: number, code: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.usersService.findById(userId);

    if (user.twoFaEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const tempSecret: string | undefined = await this.redisService.get(`${this.TEMP_2FA_SECRET_PREFIX}${userId}`);
    if (!tempSecret) {
      throw new BadRequestException('Temporary 2FA secret not found or expired.');
    }

    // Verify the code against the temporary secret
    const isValid = (await verify({ token: code, secret: tempSecret })).valid;
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Encrypt and permanently store the secret
    const encryptedSecret = this.encrypt(tempSecret);
    await this.usersService.update(userId, {
      twoFaSecret: encryptedSecret,
      twoFaEnabled: true,
    });

    // Generate and store recovery codes
    const recoveryCodes = await this.generateAndStoreRecoveryCodes(userId);

    // Clear temporary secret
    await this.redisService.delete(`${this.TEMP_2FA_SECRET_PREFIX}${userId}`);

    return { recoveryCodes };
  }

  /**
   * Disables 2FA for a user. Optionally requires a valid 2FA code or recovery code.
   * If code is provided, it will be validated; otherwise, disables without check.
   */
  async disableTwoFactor(userId: number, code?: string): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (!user.twoFaEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // If code is provided, verify it before disabling
    if (code) {
      const isValid = await this.validateTwoFactorCode(userId, code);
      if (!isValid) {
        // Also try recovery code
        const isRecoveryValid = await this.validateRecoveryCode(userId, code);
        if (!isRecoveryValid) {
          throw new UnauthorizedException('Invalid 2FA or recovery code');
        }
      }
    }

    // Clear all 2FA related fields
    await this.usersService.update(userId, {
      twoFaEnabled: false,
      twoFaSecret: null,
      twoFaRecoveryCodesHashes: null,
    });
  }

  /**
   * Validates a TOTP code against the user's stored (encrypted) 2FA secret.
   * Returns true if the code is valid, false otherwise.
   */
  async validateTwoFactorCode(userId: number, code: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);

    if (!user.twoFaEnabled || !user.twoFaSecret) {
      return false;
    }

    try {
      const decryptedSecret = this.decrypt(user.twoFaSecret);
      return (await verify({ token: code, secret: decryptedSecret })).valid;
    } catch {
      return false;
    }
  }

  /**
   * Validates a recovery code. If valid, the used code is removed from the list.
   * Returns true if the recovery code is valid and has been consumed.
   */
  async validateRecoveryCode(userId: number, recoveryCode: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);

    if (!user.twoFaEnabled || !user.twoFaRecoveryCodesHashes?.length) {
      return false;
    }

    const hashes = user.twoFaRecoveryCodesHashes;
    for (let i = 0; i < hashes.length; i++) {
      const match = await this.compare(recoveryCode, hashes[i]);
      if (match) {
        // Remove the used recovery code
        const newHashes = [...hashes];
        newHashes.splice(i, 1);
        await this.usersService.update(userId, {
          twoFaRecoveryCodesHashes: newHashes,
        });
        return true;
      }
    }
    return false;
  }

  // ==========================================================================
  // ============================== PRIVATE ===================================
  // ==========================================================================

  private async generateAndStoreRecoveryCodes(userId: number): Promise<string[]> {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < this.recoveryCodesCount; i++) {
      const code = randomBytes(this.recoveryCodeLength / 2).toString('hex'); // hex: 2 chars per byte
      plainCodes.push(code);
      hashedCodes.push(await this.hash(code));
    }

    await this.usersService.update(userId, {
      twoFaRecoveryCodesHashes: hashedCodes,
    });
    return plainCodes;
  }

  private encrypt(text: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  private decrypt(encryptedData: string): string {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const iv = buffer.subarray(0, 12);
      const authTag = buffer.subarray(12, 28);
      const encrypted = buffer.subarray(28);
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = decipher.update(encrypted);
      return Buffer.concat([decrypted, decipher.final()]).toString('utf8');
    } catch {
      throw new BadRequestException('Invalid encrypted data');
    }
  }

  private async hash(data: string): Promise<string> {
    return bcrypt.hash(data, this.saltRounds);
  }

  private async compare(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }
}
