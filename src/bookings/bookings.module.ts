import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from '../entities/booking.entity';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';
import { BullQueueModule } from '../bull/bull.module';
import { WalletsModule } from '../wallets/wallets.module';
import { BookingCompletionProcessor } from './processors/booking-completion.processor';
import { BookingStartProcessor } from './processors/booking-start.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    ListingsModule,
    UsersModule,
    WalletsModule,
    BullQueueModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingCompletionProcessor, BookingStartProcessor],
  exports: [BookingsService],
})
export class BookingsModule {}
