import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { SearchNotificationsDto } from '.././dto/requests/search-notifications.dto';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';
import { NotificationSetting } from '../../entities/notification-setting.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationSetting)
    private notificationSettingRepository: Repository<NotificationSetting>,
  ) {}

  async create(
    userId: number, 
    type: NotificationType, 
    channel: NotificationChannel, 
    referenceId?: number, 
    payload?: any
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user: { id: userId },
      type,
      channel,
      referenceId: referenceId ?? null,
      payload: payload ?? null,
      isRead: false,
    });
    return await this.notificationRepository.save(notification);
  }


  async findAllPush(userId: number, dto: SearchNotificationsDto) {
    const where: FindOptionsWhere<Notification> = {
      user: { id: userId },
      channel: NotificationChannel.FCM
    };
    if (dto.type !== undefined ) {
      where.type = dto.type;
    }
    if (dto.isRead !== undefined ) {
      where.isRead = dto.isRead;
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: dto.limit,
      skip: dto.offset
    });
    
    return {
      notifications,
      total,
      limit: dto.limit,
      offset: dto.offset,
    };
  }
  

  async findById(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }


  async markAsRead(userId: number, notificationIds?: number[]): Promise<void> {    
    const where: FindOptionsWhere<Notification> = {
      user: { id: userId },
      isRead: false,
    };

    if (notificationIds?.length) {
      where.id = In(notificationIds);
    }

    await this.notificationRepository.update(where, { isRead: true });
  }


  async getUserNotificationSettings(userId: number): Promise<NotificationSetting> {
    let settings = await this.notificationSettingRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!settings) {
      settings = this.notificationSettingRepository.create({
        user: { id: userId },
      });
      settings = await this.notificationSettingRepository.save(settings);
    }

    return settings;
  }
}
