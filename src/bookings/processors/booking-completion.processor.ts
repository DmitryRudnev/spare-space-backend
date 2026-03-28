import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BookingStatus } from '../../common/enums/booking-status.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { BookingsService } from '../bookings.service';

@Processor('booking-completion')
export class BookingCompletionProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingCompletionProcessor.name);

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<{ bookingId: number }>): Promise<void> {
    const { bookingId } = job.data;

    try {
      const booking = await this.bookingsService.findById(bookingId);

      // Проверяем, что бронирование действительно завершено
      if (booking.status !== BookingStatus.CONFIRMED) {
        this.logger.debug(`Booking ${bookingId} status is ${booking.status}, skipping completion`);
        return;
      }

      // Дополнительная проверка: период бронирования должен закончиться
      const bookingEndDate = new Date(booking.periodDates.end);
      if (bookingEndDate > new Date()) {
        this.logger.warn(`Booking ${bookingId} end date is in future, skipping`);
        return;
      }

      // Обновляем статус
      await this.bookingsService.updateStatus(bookingId, BookingStatus.COMPLETED);
      this.logger.log(`Booking ${bookingId} automatically completed`);

      // Эмитим уведомление арендатору
      const { start: startDate, end: endDate } = booking.periodDates;
      this.eventEmitter.emit('notification.signal', {
        userId: booking.renter.id,
        type: NotificationType.BOOKING_COMPLETED,
        referenceId: booking.id,
        payload: {
          bookingId: booking.id,
          listingId: booking.listing.id,
          listingTitle: booking.listing.title,
          startDate,
          endDate,
          price: booking.totalPrice,
          currency: booking.currency,
        },
      });

      // Эмитим уведомление владельцу
      this.eventEmitter.emit('notification.signal', {
        userId: booking.listing.user.id,
        type: NotificationType.BOOKING_COMPLETED,
        referenceId: booking.id,
        payload: {
          bookingId: booking.id,
          listingId: booking.listing.id,
          listingTitle: booking.listing.title,
          startDate,
          endDate,
          price: booking.totalPrice,
          currency: booking.currency,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to process completion for booking ${bookingId}:`, error);
      throw error; // BullMQ автоматически повторит попытку
    }
  }
}
