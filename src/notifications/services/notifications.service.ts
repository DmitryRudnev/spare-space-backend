import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { NotificationDelivery } from '../../entities/notification-delivery.entity';
import { SearchNotificationsDto } from '.././dto/requests/search-notifications.dto';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';
import { NotificationDeliveryStatus } from '../../common/enums/notification-delivery-status.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private notificationDeliveryRepository: Repository<NotificationDelivery>,
  ) {}

  async create(
    userId: number, 
    type: NotificationType, 
    referenceId?: number, 
    payload?: any
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user: { id: userId },
      type,
      referenceId,
      payload,
      isRead: false,
    });
    return await this.notificationRepository.save(notification);
  }


  async createDelivery(
    notificationId: number,
    channel: NotificationChannel,
    status?: NotificationDeliveryStatus,
    errorMessage?: string,
  ): Promise<NotificationDelivery> {
    const notificationDelivery = this.notificationDeliveryRepository.create({
      notificationId,
      channel,
      status,
      errorMessage,
    });
    return this.notificationDeliveryRepository.save(notificationDelivery);
  }


  async findAll(userId: number, dto: SearchNotificationsDto) {
    const where: FindOptionsWhere<Notification> = {
      user: { id: userId },
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
}
