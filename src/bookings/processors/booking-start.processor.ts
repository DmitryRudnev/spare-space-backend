import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { BookingsService } from '../bookings.service';
import { BookingStatus } from '../../common/enums/booking-status.enum';

@Processor('booking-start')
export class BookingStartProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingStartProcessor.name);

  constructor(
    private readonly bookingsService: BookingsService,
    @InjectQueue('booking-completion') private bookingCompletionQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ bookingId: number }>): Promise<void> {
    const { bookingId } = job.data;

    try {
      const booking = await this.bookingsService.findById(bookingId);

      if (booking.status !== BookingStatus.CONFIRMED) {
        this.logger.warn(`Booking ${bookingId} is not CONFIRMED (current: ${booking.status}), skipping start`);
        return;
      }

      await this.bookingsService.updateStatus(bookingId, BookingStatus.ACTIVE);
      this.logger.log(`Booking ${bookingId} is now ACTIVE`);

      const delay = new Date(booking.periodDates.end).getTime() - Date.now();
      await this.bookingCompletionQueue.add(
        'complete-booking',
        { bookingId },
        { delay: Math.max(0, delay), attempts: 3, removeOnComplete: true }
      );
    } catch (error) {
      this.logger.error(`Failed to process start for booking ${bookingId}:`, error);
      throw error;
    }
  }
}
