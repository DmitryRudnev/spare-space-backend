import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';
import { UserRoleType } from '../../common/enums/user-role-type.enum';
import { UpdateUserDto } from '../dto/requests/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) 
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole) 
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async findById(userId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }

  async userExists(userId: number): Promise<boolean> {
    return this.userRepository.existsBy({ id: userId });
  }

  async validateUserExistence(userId: number): Promise<void> {
    if (! await this.userExists(userId)) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }
  
  async update(userId: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.patronymic !== undefined) {
      user.patronymic = dto.patronymic;
    }
    if (dto.phone !== undefined) { 
      const phoneExists = await this.userRepository.findOneBy({ phone: dto.phone });
      if (phoneExists && phoneExists.id !== userId) {
        throw new ConflictException('Phone already exists');
      }
      user.phone = dto.phone;
    }
    if (dto.email !== undefined) {
      const emailExists = await this.userRepository.findOneBy({ email: dto.email });
      if (emailExists && emailExists.id !== userId) {
        throw new ConflictException('Email already exists');
      }
      user.email = dto.email;
    }
    
    return this.userRepository.save(user);
  }

  // ==========================================================================
  // ================================= ROLES ==================================
  // ==========================================================================

  async getUserRoles(userId: number): Promise<UserRoleType[]> {
    const roles = await this.userRoleRepository.find({
      where: { user: { id: userId } },
      select: { role: true }
    });
    return roles.map((userRole) => userRole.role);
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
  }

  async removeRole(userId: number, role: UserRoleType): Promise<void> {
    await this.userRoleRepository.delete({ 
      user: { id: userId }, 
      role 
    });
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
  
  async updateTelegramId(userId: number, newTelegramId: number | null): Promise<User> {
    const user = await this.findById(userId);
    user.telegramId = newTelegramId;
    return this.userRepository.save(user);
  }

  async updateTelegramChatId(userId: number, newTelegramChatId: number | null): Promise<User> {
    const user = await this.findById(userId);
    user.telegramChatId = newTelegramChatId;
    return this.userRepository.save(user);
  }

  // ==========================================================================
  // ================================== 2FA ===================================
  // ==========================================================================

  async getTwoFactorSecret(userId: number): Promise<string | null> {
    const user = await this.findById(userId);
    return user.twoFaSecret;
  }

  async setTwoFactorSecret(userId: number, secret: string | null): Promise<User> {
    const user = await this.findById(userId);
    user.twoFaSecret = secret;
    return this.userRepository.save(user);
  }

  async getTwoFactorTempSecret(userId: number): Promise<string | null> {
    const user = await this.findById(userId);
    return user.twoFaTempSecret;
  }

  async setTwoFactorTempSecret(userId: number, secret: string | null): Promise<User> {
    const user = await this.findById(userId);
    user.twoFaTempSecret = secret;
    return this.userRepository.save(user);
  }

  async isTwoFactorEnabled(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    return user.twoFaEnabled;
  }

  async setTwoFactorEnabled(userId: number, enabled: boolean): Promise<User> {
    const user = await this.findById(userId);
    user.twoFaEnabled = enabled;
    return this.userRepository.save(user);
  }

  async getTwoFactorRecoveryCodesHashes(userId: number): Promise<string[] | null> {
    const user = await this.findById(userId);
    return user.twoFaRecoveryCodesHashes;
  }

  async setTwoFactorRecoveryCodesHashes(userId: number, hashes: string[] | null): Promise<User> {
    const user = await this.findById(userId);
    user.twoFaRecoveryCodesHashes = hashes;
    return this.userRepository.save(user);
  }
}
