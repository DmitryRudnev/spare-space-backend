import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NotificationType } from '../common/enums/notification-type.enum';
import { Booking } from '../entities/booking.entity';
import { PeriodDto } from '../common/dto/period.dto';

@Injectable()
export class BookingsListener {
  private readonly logger = new Logger(BookingsListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('booking-start') private bookingStartQueue: Queue,
    @InjectQueue('booking-completion') private bookingCompletionQueue: Queue,
  ) {}

  @OnEvent('booking.created')
  async handleBookingCreated(booking: Booking) {
    this.eventEmitter.emit('notification.signal', {
      userId: booking.listing.user.id,
      type: NotificationType.BOOKING_NEW,
      referenceId: booking.id,
      payload: {
        bookingId: booking.id,
        listingId: booking.listing.id,
        listingTitle: booking.listing.title,
        renterName: `${booking.renter.firstName} ${booking.renter.lastName}`,
        renterRating: booking.renter.rating,
        renterVerified: booking.renter.verified,
        startDate: booking.periodDates.start,
        endDate: booking.periodDates.end,
        price: booking.totalPrice,
      },
    });
  }

  @OnEvent('booking.period_updated')
  async handleBookingPeriodUpdated(booking: Booking, prevPeriod: PeriodDto) {
    this.eventEmitter.emit('notification.signal', {
      userId: booking.listing.user.id,
      type: NotificationType.BOOKING_PERIOD_UPDATED,
      referenceId: booking.id,
      payload: {
        bookingId: booking.id,
        listingId: booking.listing.id,
        listingTitle: booking.listing.title,
        renterName: `${booking.renter.firstName} ${booking.renter.lastName}`,
        renterRating: booking.renter.rating,
        startDate: booking.periodDates.start,
        endDate: booking.periodDates.end,
        price: booking.totalPrice,
        prevPeriod,
      },
    });
  }

  @OnEvent('booking.confirmed')
  async handleBookingConfirmed(booking: Booking) {
    this.eventEmitter.emit('notification.signal', {
      userId: booking.renter.id,
      type: NotificationType.BOOKING_CONFIRMED,
      referenceId: booking.id,
      payload: {
        bookingId: booking.id,
        listingId: booking.listing.id,
        listingTitle: booking.listing.title,
        startDate: booking.periodDates.start,
        endDate: booking.periodDates.end,
        price: booking.totalPrice,
      },
    });

    const delay = new Date(booking.periodDates.start).getTime() - Date.now();
    this.logger.log(`Scheduling booking start for booking ${booking.id} with delay: ${Math.max(0, delay)/1000/60} minutes`);
    await this.bookingStartQueue.add('start-booking', { bookingId: booking.id }, {
      jobId: `start-${booking.id}`,
      delay: Math.max(0, delay),
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  @OnEvent('booking.cancelled')
  async handleBookingCancelled(booking: Booking) {
    this.emitStatusChangeNotification(booking, Number(booking.listing.user.id), NotificationType.BOOKING_CANCELLED);
    await this.bookingStartQueue.remove(`start-${booking.id}`);
  }

  @OnEvent('booking.rejected')
  async handleBookingRejected(booking: Booking) {
    this.emitStatusChangeNotification(booking, Number(booking.renter.id), NotificationType.BOOKING_REJECTED);
    await this.bookingStartQueue.remove(`start-${booking.id}`);
  }

  private emitStatusChangeNotification(booking: Booking, targetUserId: number, type: NotificationType) {
    this.eventEmitter.emit('notification.signal', {
      userId: targetUserId,
      type,
      referenceId: booking.id,
      payload: {
        bookingId: booking.id,
        listingId: booking.listing.id,
        listingTitle: booking.listing.title,
        startDate: booking.periodDates.start,
        endDate: booking.periodDates.end,
        price: booking.totalPrice,
      },
    });
  }
}
