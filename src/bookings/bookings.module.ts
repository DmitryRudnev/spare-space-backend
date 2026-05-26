import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookingsController } from './bookings.controller';
import { BookingsHandler } from './bookings.handler';
import { BookingsService } from './bookings.service';
import { BookingsListener } from './bookings.listener';
import { BookingCompletionProcessor } from './processors/booking-completion.processor';
import { BookingStartProcessor } from './processors/booking-start.processor';

import { Booking } from '../entities/booking.entity';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';
import { BullQueueModule } from '../bull/bull.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    ListingsModule,
    UsersModule,
    WalletsModule,
    BullQueueModule,
  ],
  controllers: [BookingsController],
  providers: [
    BookingsHandler, 
    BookingsService, 
    BookingsListener,
    BookingStartProcessor,
    BookingCompletionProcessor, 
  ],
  exports: [BookingsService, BookingsHandler],
})
export class BookingsModule {}
