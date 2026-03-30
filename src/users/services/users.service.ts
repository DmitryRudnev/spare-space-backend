import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';
import { UserRoleType } from '../../common/enums/user-role-type.enum';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class UsersService {
  private readonly USER_PROFILE_CACHE_PREFIX = 'user:profile:';
  private readonly USER_STATUS_CACHE_PREFIX = 'user:status:';
  private readonly USER_ROLES_CACHE_PREFIX = 'user:roles:';
  private readonly USER_PROFILE_CACHE_TTL_SEC = 3600; // 1 час; можно и больше, т. к. при любых изменениях ключ инвалидируется
  private readonly USER_STATUS_CACHE_TTL_SEC = 3600; // аналогично предыдущему
  private readonly USER_ROLES_CACHE_TTL_SEC = 3600; // аналогично предыдущему

  constructor(
    @InjectRepository(User) 
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole) 
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly redisService: RedisService,
  ) {}

  async findById(userId: number): Promise<User> {
    // 1. Получаем профиль (все поля кроме isOnline, lastSeenAt)
    const profileData = await this.redisService.getOrSet(
      `${this.USER_PROFILE_CACHE_PREFIX}${userId}`,
      this.USER_PROFILE_CACHE_TTL_SEC,
      () => this.userRepository.findOne({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          patronymic: true,
          passwordHash: true,
          rating: true,
          telegramId: true,
          telegramChatId: true,
          verified: true,
          twoFaEnabled: true,
          twoFaSecret: true,
          twoFaRecoveryCodesHashes: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      User
    );
    if (!profileData) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // 2. Получаем статус (isOnline, lastSeenAt)
    const statusData = await this.redisService.getOrSet(
      `${this.USER_STATUS_CACHE_PREFIX}${userId}`,
      this.USER_STATUS_CACHE_TTL_SEC,
      () => this.userRepository.findOne({
        where: { id: userId },
        select: {
          isOnline: true,
          lastSeenAt: true,
        }
      }),
      User
    );
    if (!statusData) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // 3. Объединяем данные
    const merged = {
      ...profileData,
      isOnline: statusData.isOnline,
      lastSeenAt: statusData.lastSeenAt,
    };

    // 4. Возвращаем полноценный экземпляр User
    return this.userRepository.create(merged);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOneBy({ phone });
  }

  async exists(userId: number): Promise<boolean> {
    return this.userRepository.existsBy({ id: userId });
  }

  async validateExistence(userId: number): Promise<void> {
    if (! await this.exists(userId)) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsBy({ email });
  }

  async existsByPhone(phone: string): Promise<boolean> {
    return this.userRepository.existsBy({ phone });
  }

  async create(
    phone: string,
    email: string | null,
    passwordHash: string,
    firstName: string,
    lastName: string,
    patronymic: string | null,
  ): Promise<User> {
    const data: DeepPartial<User> = {
      phone,
      email,
      passwordHash,
      firstName,
      lastName,
      patronymic,
      rating: 0,
    };

    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }
  
  async update(userId: number, update: Partial<User>): Promise<User> {
    if (update.phone) {
      const phoneExists = await this.userRepository.existsBy({ phone: update.phone });
      if (phoneExists) {
        throw new ConflictException('Phone already exists');
      }
    }
    if (update.email) {
      const emailExists = await this.userRepository.existsBy({ email: update.email });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }
    if (update.telegramId) {
      const tgUserExists = await this.userRepository.existsBy({ telegramId: update.telegramId });
      if (tgUserExists) {
        throw new ConflictException('Telegram id already exists');
      }
    }
    if (update.telegramChatId) {
      const tgChatExists = await this.userRepository.existsBy({ telegramChatId: update.telegramChatId });
      if (tgChatExists) {
        throw new ConflictException('Telegram chat already exists');
      }
    }
    
    const user = await this.findById(userId);
    await this.redisService.delete(`${this.USER_PROFILE_CACHE_PREFIX}${userId}`);
    Object.assign(user, update);
    return this.userRepository.save(user);
  }

  async updateOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      {
        isOnline,
        lastSeenAt: new Date(),
      }
    );
    await this.redisService.delete(`${this.USER_STATUS_CACHE_PREFIX}${userId}`);
  }

  // ==========================================================================
  // ================================= ROLES ==================================
  // ==========================================================================

  async getUserRoles(userId: number): Promise<UserRoleType[]> {
    return this.redisService.getOrSet<UserRoleType[]>(
      `${this.USER_ROLES_CACHE_PREFIX}${userId}`,
      this.USER_ROLES_CACHE_TTL_SEC,
      async () => {
        const roles = await this.userRoleRepository.find({
          where: { user: { id: userId } },
          select: { role: true }
        });
        return roles.map((userRole) => userRole.role);
      }
    );
  }

  async hasRole(userId: number, role: UserRoleType): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(role);
  }

  async addRole(userId: number, role: UserRoleType): Promise<void> {
    const roleExists = await this.hasRole(userId, role);
    if (roleExists) {
      throw new ConflictException(`Role ${role} already exists for user`);
    }
    const userRole = this.userRoleRepository.create({ 
      user: { id: userId }, 
      role 
    });
    await this.userRoleRepository.save(userRole);
    await this.redisService.delete(`${this.USER_ROLES_CACHE_PREFIX}${userId}`);
  }

  async removeRole(userId: number, role: UserRoleType): Promise<void> {
    await this.userRoleRepository.delete({ 
      user: { id: userId }, 
      role 
    });
    await this.redisService.delete(`${this.USER_ROLES_CACHE_PREFIX}${userId}`);
  }

  // ==========================================================================
  // ================================ TELEGRAM ================================
  // ==========================================================================

  async findByTelegramId(telegramId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ telegramId });
    if (!user) {
      throw new NotFoundException(`User with telegram id ${telegramId} not found`);
    }
    return user;
  }
}
