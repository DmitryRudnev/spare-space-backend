import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from '../entities/booking.entity';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';
import { BullQueueModule } from '../bull/bull.module';
import { BookingCompletionProcessor } from './processors/booking-completion.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    ListingsModule,
    UsersModule,
    BullQueueModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingCompletionProcessor],
  exports: [BookingsService],
})
export class BookingsModule {}
