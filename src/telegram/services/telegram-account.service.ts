import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { TelegramVerificationService } from './telegram-verification.service';
import { TelegramSetupService } from './telegram-setup.service';

/**
 * Сервис для управления привязкой и отвязкой Telegram аккаунтов
 * @class
 * @public
 */
@Injectable()
export class TelegramAccountService {
  private readonly logger = new Logger(TelegramAccountService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly verificationService: TelegramVerificationService,
    private readonly setupService: TelegramSetupService,
  ) {}

  /**
   * Генерирует ссылку для привязки Telegram аккаунта
   * @param {number} userId - ID пользователя
   * @returns {Promise<string>} Ссылка для привязки Telegram
   * @throws {NotFoundException} Если пользователь не найден
   */
  async generateTelegramLink(userId: number): Promise<string> {
    await this.usersService.validateExistence(userId);

    const botUsername = this.setupService.getBotUsername();
    const token = await this.verificationService.generateToken(userId);
    const link = `https://t.me/${botUsername}?start=${token}`;
    
    this.logger.log(`Сгенерирована ссылка для привязки Telegram для пользователя ${userId}`);
    return link;
  }

  /**
   * Отвязывает Telegram аккаунт от пользователя
   * @param {number} userId - ID пользователя
   * @param {number} telegramId - ID Telegram аккаунта
   * @returns {Promise<void>}
   * @throws {NotFoundException} Если пользователь не найден
   * @throws {ConflictException} Если Telegram аккаунт не привязан к пользователю
   */
  async unlinkTelegramAccount(userId: number, telegramId?: number): Promise<void> {
    // Пока что в БД предусмотрен только 1 ТГ аккаунт для одного пользователя
    // Если это потом изменится, то в контроллере надо будет принимать telegramId
    // и изменить логику этого метода
    if (telegramId) {
      const user = await this.usersService.findById(userId);
      if (user.telegramId != telegramId) {
        throw new ConflictException('Указанный Telegram аккаунт не привязан к пользователю');
      }
    }

    await this.usersService.update(userId, {
      telegramId: null,
      telegramChatId: null,
      telegramUsername: null,
    });
    this.logger.log(`Telegram аккаунт ${telegramId} отвязан от пользователя ${userId}`);
  }
}
