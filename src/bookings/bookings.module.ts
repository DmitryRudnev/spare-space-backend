import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from '../entities/booking.entity';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), ListingsModule, UsersModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
