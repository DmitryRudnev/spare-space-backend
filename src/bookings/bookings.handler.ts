import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/requests/create-booking.dto';
import { SearchBookingsDto } from './dto/requests/search-bookings.dto';
import { UpdateBookingPeriodDto } from './dto/requests/update-booking-period.dto';
import { WalletsService } from '../wallets/wallets.service';
import { UsersService } from '../users/services/users.service';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { PeriodDto } from '../common/dto/period.dto';
import { Booking } from '../entities/booking.entity';

@Injectable()
export class BookingsHandler {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly walletsService: WalletsService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    userId: number,
    searchDto: SearchBookingsDto,
  ): Promise<{ bookings: Booking[]; total: number; limit: number; offset: number }> {
    return this.bookingsService.findAll(userId, searchDto);
  }

  async findById(userId: number, bookingId: number): Promise<Booking> {
    await this.bookingsService.validateUserParticipation(bookingId, userId);
    return this.bookingsService.findById(bookingId);
  }

  async getListingAvailability(userId: number, listingId: number, excludeBookingId?: number): Promise<PeriodDto[]> {
    if (excludeBookingId) {
      const booking = await this.bookingsService.findById(excludeBookingId);
      if (booking.renter.id !== userId) {
        throw new UnauthorizedException('You can only exclude your own booking');
      }
      if (booking.listing.id !== listingId) {
        throw new BadRequestException('Excluded booking does not belong to the specified listing');
      }
    }
    
    return this.bookingsService.getListingAvailability(listingId, excludeBookingId);
  }

  async create(userId: number, createDto: CreateBookingDto) {
    const hasRenter = await this.usersService.hasRole(userId, UserRoleType.RENTER);
    if (!hasRenter) throw new UnauthorizedException('Only renters can create bookings');

    const booking = await this.bookingsService.create(userId, createDto);

    try {
      await this.walletsService.processBookingPayment(userId, booking.id, booking.totalPrice);
    } catch (error) {
      await this.bookingsService.delete(booking);
      throw error;
    }

    this.eventEmitter.emit('booking.created', booking);
    return booking;
  }

  async updatePeriod(userId: number, bookingId: number, updateDto: UpdateBookingPeriodDto) {
    const booking = await this.bookingsService.findById(bookingId);
    if (userId !== booking.renter.id) throw new UnauthorizedException(`Only renter can update period`);
    if (booking.status !== BookingStatus.PENDING) throw new BadRequestException(`Only pending booking can be updated`);

    const prevPeriod = booking.periodDates;
    const prevPrice = booking.totalPrice;
    const updatedBooking = await this.bookingsService.updatePeriod(bookingId, updateDto);

    const priceDiff = updatedBooking.totalPrice - prevPrice;
    if (priceDiff > 0) {
      await this.walletsService.processBookingPayment(userId, booking.id, priceDiff);
    } else if (priceDiff < 0) {
      await this.walletsService.processRefund(userId, booking.id, Math.abs(priceDiff));
    }
    
    this.eventEmitter.emit('booking.period_updated', updatedBooking, prevPeriod);
    return updatedBooking;
  }

  async cancel(userId: number, bookingId: number) {
    const booking = await this.bookingsService.findById(bookingId);
    if (userId !== booking.renter.id) throw new UnauthorizedException('Only renter can cancel');
    if (booking.status !== BookingStatus.PENDING) throw new BadRequestException('Only pending booking can be cancelled');
    if (booking.periodDates.start < new Date()) throw new BadRequestException('Booking start date cannot be in past');

    const cancelledBooking = await this.bookingsService.updateStatus(bookingId, BookingStatus.CANCELLED);
    await this.walletsService.processRefund(cancelledBooking.renter.id, cancelledBooking.id, cancelledBooking.totalPrice);
    
    this.eventEmitter.emit('booking.cancelled', cancelledBooking);
    return cancelledBooking;
  }

  async confirm(userId: number, bookingId: number) {
    const booking = await this.bookingsService.findById(bookingId);
    if (userId !== booking.listing.user.id) throw new UnauthorizedException('Only landlord can confirm');
    if (booking.status !== BookingStatus.PENDING) throw new BadRequestException('Only pending booking can be confirmed');
    if (booking.periodDates.start < new Date()) throw new BadRequestException('Booking start date cannot be in past');

    const confirmedBooking = await this.bookingsService.updateStatus(bookingId, BookingStatus.CONFIRMED);
    this.eventEmitter.emit('booking.confirmed', confirmedBooking);
    return confirmedBooking;
  }

  async reject(userId: number, bookingId: number) {
    const booking = await this.bookingsService.findById(bookingId);
    if (userId !== booking.listing.user.id) throw new UnauthorizedException('Only landlord can reject');
    if (booking.status !== BookingStatus.PENDING) throw new BadRequestException('Only pending booking can be rejected');
    if (booking.periodDates.start < new Date()) throw new BadRequestException('Booking start date cannot be in past');

    const rejectedBooking = await this.bookingsService.updateStatus(bookingId, BookingStatus.REJECTED);
    await this.walletsService.processRefund(rejectedBooking.renter.id, rejectedBooking.id, rejectedBooking.totalPrice);
    
    this.eventEmitter.emit('booking.rejected', rejectedBooking);
    return rejectedBooking;
  }
}
