import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserDevice } from '../entities/user-device.entity';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(UserDevice)
    private readonly deviceRepository: Repository<UserDevice>,
  ) {}

  /**
   * Обновляет FCM токен для конкретного устройства пользователя или создает новую запись.
   * @param userId ID пользователя из JWT
   * @param dto Данные об устройстве и токене
   */
  async upsertDevice(userId: number, dto: UpdateDeviceDto): Promise<UserDevice> {
    try {
      // Ищем устройство по связке пользователя и ID устройства
      let device = await this.deviceRepository.findOne({
        where: { 
          user: { id: userId }, 
          deviceId: dto.deviceId 
        }
      });

      if (device) {
        // Если устройство найдено, обновляем токен и платформу
        device.fcmToken = dto.fcmToken;
        if (dto.platform) {
            device.platform = dto.platform;
        }
        this.logger.log(`Updated FCM token for device ${dto.deviceId} (User: ${userId})`);
      } else {
        // Если устройство новое, создаем запись
        device = this.deviceRepository.create({
          user: { id: userId },
          fcmToken: dto.fcmToken,
          deviceId: dto.deviceId,
          platform: dto.platform ?? null,
        });
        this.logger.log(`Registered new device ${dto.deviceId} for user ${userId}`);
      }

      return await this.deviceRepository.save(device);
    } catch (error) {
      this.logger.error(`Failed to upsert device for user ${userId}:`, error);
      throw new Error(`Device registration failed: ${error.message}`);
    }
  }

  /**
   * Удалить токен устройства для конкретного пользователя
   * @param userId ID пользователя из JWT
   * @param fcmToken FCM токен устройства, который нужно удалить
   */
  async deleteDevice(userId: number, fcmToken: string): Promise<void> {
    await this.deviceRepository.delete({ 
      user: { id: userId },
      fcmToken,
    });
  }

  /**
   * Получить все активные токены пользователя для рассылки Push
   */
  async getUserTokens(userId: number): Promise<string[]> {
    const devices = await this.deviceRepository.find({
      where: { user: { id: userId } },
      select: { fcmToken: true },
    });
    return devices.map(d => d.fcmToken);
  }

  /**
   * Удалить токен (например, если Firebase вернул ошибку "NotRegistered")
   */
  async deleteTokens(fcmTokens: string[]): Promise<void> {
    await this.deviceRepository.delete({ fcmToken: In(fcmTokens) });
  }
}
