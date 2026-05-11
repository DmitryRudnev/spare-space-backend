import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, Raw, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/services/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { Booking } from '../entities/booking.entity';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { NotificationType } from '../common/enums/notification-type.enum';

import { CreateBookingDto } from './dto/requests/create-booking.dto';
import { SearchBookingsDto } from './dto/requests/search-bookings.dto';
import { UpdateBookingPeriodDto } from './dto/requests/update-booking-period.dto';


@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    private readonly listingsService: ListingsService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('booking-completion') private bookingCompletionQueue: Queue,
    @InjectQueue('booking-start') private bookingStartQueue: Queue,
  ) {}


  // ==========================================================================
  // =============================== USE CASES ================================
  // ==========================================================================


  async handleFindAll(
    userId: number,
    searchDto: SearchBookingsDto,
  ): Promise<{ bookings: Booking[]; total: number; limit: number; offset: number }> {
    return this.findAll(userId, searchDto);
  }


  async handleFindById(userId: number, bookingId: number): Promise<Booking> {
    await this.validateUserParticipation(bookingId, userId);
    return this.findById(bookingId);
  }


  async handleCreate(userId: number, createDto: CreateBookingDto): Promise<Booking> {
    const booking = await this.create(userId, createDto);

    try {
      await this.walletsService.processBookingPayment(userId, booking.id, booking.totalPrice);
    } catch (error) {
      await this.bookingRepository.remove(booking);
      throw error;
    }
    
    // Обновляем периоды доступности объявления
    const { start: startDate, end: endDate } = booking.periodDates;
    await this.listingsService.updateAvailabilityAfterBooking(booking.listing.id, startDate, endDate);

    // Эмитим уведомление
    const renter = await this.usersService.findById(userId);
    this.eventEmitter.emit('notification.signal', {
      userId: Number(booking.listing.user.id),
      type: NotificationType.BOOKING_NEW,
      referenceId: Number(booking.id),
      payload: {
        bookingId: Number(booking.id),
        listingId: Number(booking.listing.id),
        listingTitle: booking.listing.title,
        renterName: `${renter.firstName} ${renter.lastName}`,
        renterRating: renter.rating,
        renterVerified: renter.verified,
        startDate,
        endDate,
        price: booking.totalPrice,
      },
    });

    return booking;
  }


  async handleUpdatePeriod(userId: number, bookingId: number, updateDto: UpdateBookingPeriodDto): Promise<Booking> {
    const booking = await this.findById(bookingId);
    if (userId !== Number(booking.renter.id)) {  
      throw new UnauthorizedException(`Only renter can update booking's period`);
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Only pending booking's period can be updated`);
    }
    const updatedBooking = await this.updatePeriod(bookingId, updateDto);

    const renter = await this.usersService.findById(userId);
    const { start: startDate, end: endDate } = updatedBooking.periodDates;
    
    this.eventEmitter.emit('notification.signal', {
      userId: Number(updatedBooking.listing.user.id),
      type: NotificationType.BOOKING_CONFIRMED,
      referenceId: Number(updatedBooking.id),
      payload: {
        bookingId: Number(updatedBooking.id),
        listingId: Number(updatedBooking.listing.id),
        listingTitle: updatedBooking.listing.title,
        renterName: `${renter.firstName} ${renter.lastName}`,
        renterRating: renter.rating,
        startDate,
        endDate,
        price: updatedBooking.totalPrice,
      },
    });

    return updatedBooking;
  }


  async handleConfirm(userId: number, bookingId: number): Promise<Booking> {    
    const booking = await this.findById(bookingId);
    if (userId !== Number(booking.listing.user.id)) {
      throw new UnauthorizedException('Only landlord can confirm booking');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending booking can be confirmed');
    }
    const confirmedBooking = await this.updateStatus(bookingId, BookingStatus.CONFIRMED);
  
    const { start: startDate, end: endDate } = confirmedBooking.periodDates;
    this.eventEmitter.emit('notification.signal', {
      userId: Number(confirmedBooking.renter.id),
      type: NotificationType.BOOKING_CONFIRMED,
      referenceId: Number(confirmedBooking.id),
      payload: {
        bookingId: Number(confirmedBooking.id),
        listingId: Number(confirmedBooking.listing.id),
        listingTitle: confirmedBooking.listing.title,
        startDate,
        endDate,
        price: confirmedBooking.totalPrice,
      },
    });

    const delay = new Date(startDate).getTime() - Date.now();
    this.logger.log(`Scheduling booking start for booking ${confirmedBooking.id} with delay: ${Math.max(0, delay)/1000/60} minutes`);
    
    const job = await this.bookingStartQueue.add(
      'start-booking',
      { bookingId: confirmedBooking.id },
      {
        delay: Math.max(0, delay),
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    
    if (!job.id) {
      throw new Error(`Failed to create delayed job for booking start (booking id ${confirmedBooking.id})`);
    }


    return confirmedBooking;
  }


  async handleCancel(userId: number, bookingId: number): Promise<Booking> {
    const booking = await this.findById(bookingId);
    if (userId !== Number(booking.renter.id)) {
      throw new UnauthorizedException('Only renter can cancel booking');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending booking can be confirmed');
    }
    
    const cancelledBooking = await this.updateStatus(bookingId, BookingStatus.CANCELLED);
    await this.walletsService.processRefund(Number(cancelledBooking.renter.id), cancelledBooking.id, cancelledBooking.totalPrice);
    const { start: startDate, end: endDate } = cancelledBooking.periodDates;

    this.eventEmitter.emit('notification.signal', {
      userId: Number(cancelledBooking.listing.user.id),
      type: NotificationType.BOOKING_CANCELLED,
      referenceId: Number(cancelledBooking.id),
      payload: {
        bookingId: Number(cancelledBooking.id),
        listingId: Number(cancelledBooking.listing.id),
        listingTitle: cancelledBooking.listing.title,
        startDate,
        endDate,
        price: cancelledBooking.totalPrice,
      },
    });
    
    return cancelledBooking;
  }


  async handleReject(userId: number, bookingId: number): Promise<Booking> {
    const booking = await this.findById(bookingId);
    if (userId !== Number(booking.listing.user.id)) {
      throw new UnauthorizedException('Only landlord can reject booking');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending booking can be rejected');
    }
    
    const rejectedBooking = await this.updateStatus(bookingId, BookingStatus.REJECTED);
    await this.walletsService.processRefund(Number(rejectedBooking.renter.id), rejectedBooking.id, rejectedBooking.totalPrice);
    const { start: startDate, end: endDate } = rejectedBooking.periodDates;

    this.eventEmitter.emit('notification.signal', {
      userId: Number(rejectedBooking.renter.id),
      type: NotificationType.BOOKING_REJECTED,
      referenceId: Number(rejectedBooking.id),
      payload: {
        bookingId: Number(rejectedBooking.id),
        listingId: Number(rejectedBooking.listing.id),
        listingTitle: rejectedBooking.listing.title,
        startDate,
        endDate,
        price: rejectedBooking.totalPrice,
      },
    });
    
    return rejectedBooking;
  }


  // ==========================================================================
  // =============================== PUBLIC API ===============================
  // ==========================================================================


  async findAll(
    userId: number,
    searchDto: SearchBookingsDto,
  ): Promise<{ bookings: Booking[]; total: number; limit: number; offset: number }> {
    const baseFilters: FindOptionsWhere<Booking> = {};
    if (searchDto.status) {
      baseFilters.status = searchDto.status;
    }

    const where: FindOptionsWhere<Booking>[] = [];
    switch (searchDto.userRole) {
      case UserRoleType.RENTER:
        where.push({ ...baseFilters, renter: { id: userId } });
        break;
      case UserRoleType.LANDLORD:
        where.push({ ...baseFilters, listing: { user: { id: userId } } });
        break;
      default:
        where.push(
          { ...baseFilters, renter: { id: userId } },
          { ...baseFilters, listing: { user: { id: userId } } }
        );
    }

    const [bookings, total] = await this.bookingRepository.findAndCount({
      where,
      relations: {
          listing: { user: true, pricings: true },
          renter: true,
      },
      order: { updatedAt: 'DESC' },
      skip: searchDto.offset,
      take: searchDto.limit,
    });

    return { bookings, total, limit: searchDto.limit, offset: searchDto.offset };
  }


  async findById(bookingId: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: {
        listing: { user: true, pricings: true },
        renter: true,
      }
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }


  async create(renterId: number, createDto: CreateBookingDto): Promise<Booking> {
    const hasRenter = await this.usersService.hasRole(renterId, UserRoleType.RENTER);
    if (!hasRenter) {
      throw new UnauthorizedException('Only renters can create bookings');
    }
    const listing = await this.listingsService.findByIdWithCache(createDto.listingId);
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Cannot book an inactive listing');
    }
    if (renterId === Number(listing.user.id)) {
      throw new BadRequestException('Cannot book owned listing');
    }
    
    const { start: startDate, end: endDate } = createDto.period;
    await this.validateBookingDates(startDate, endDate, listing.id, listing.availability);

    const selectedPricing = listing.pricings.find(p => p.pricePeriod === createDto.pricePeriod);
    if (!selectedPricing) {
      throw new BadRequestException(`Listing does not support ${createDto.pricePeriod} pricing`);
    }

    const duration = this.calculateDuration(startDate, endDate, selectedPricing.pricePeriod);
    const totalPrice = selectedPricing.price * duration;
    const period = `[${startDate.toISOString()},${endDate.toISOString()})`;

    const booking = this.bookingRepository.create({
      listing,
      renter: { id: renterId },
      period,
      price: selectedPricing.price,
      pricePeriod: selectedPricing.pricePeriod,
      totalPrice,
      status: BookingStatus.PENDING,
    });
    await this.bookingRepository.save(booking);
    return this.findById(booking.id);
  }


  async updatePeriod(bookingId: number, updatePeriodDto: UpdateBookingPeriodDto): Promise<Booking> {
    const booking = await this.findById(bookingId);

    const { start: startDate, end: endDate } = updatePeriodDto.period;
    await this.validateBookingDates(startDate, endDate, booking.listing.id, booking.listing.availability, bookingId);

    const duration = this.calculateDuration(startDate, endDate, booking.pricePeriod);
    booking.period = `[${startDate.toISOString()},${endDate.toISOString()})`;
    booking.totalPrice = booking.price * duration;

    return this.bookingRepository.save(booking);
  }


  async updateStatus(bookingId: number, newStatus: BookingStatus): Promise<Booking> {
    const booking = await this.findById(bookingId);
    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }


  async validateUserParticipation(bookingId: number, userId: number): Promise<void> {
    const booking = await this.findById(bookingId);
    const isRenter = Number(booking.renter.id) === userId;
    const isLandlord = Number(booking.listing.user.id) === userId;

    if (!isRenter && !isLandlord) {
      throw new UnauthorizedException('User is not a participant of this booking');
    }
  }


  async countByUser(userId: number, roleType: UserRoleType): Promise<number> {
    if (roleType === UserRoleType.RENTER) {
      return await this.bookingRepository.countBy({ renter: { id: userId } });
    }
    return await this.bookingRepository.countBy({ listing: { user: { id: userId } } });
  }


  // ==========================================================================
  // ================================ PRIVATE =================================
  // ==========================================================================


  private async validateBookingDates(
    startDate: Date,
    endDate: Date,
    listingId: number,
    listingAvailabilityRanges: string[],
    excludeBookingId?: number,
  ): Promise<void> {
    // Проверка 1: даты должны быть актуальными и в правильном порядке
    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Проверка 2: период бронирования должен укладываться в доступный диапазон дат объявления
    const periodStr = `[${startDate.toISOString()},${endDate.toISOString()})`;
    const [{ contained }] = await this.bookingRepository.query(
      `SELECT EXISTS (
        SELECT 1
        FROM unnest($1::tstzrange[]) AS r
        WHERE $2::tstzrange <@ r
      ) as contained`,
      [listingAvailabilityRanges, periodStr]
    );
    if (!contained) {
      throw new BadRequestException(
        `Booking period must be completely within one of the listing's availability slots`,
      );
    }
    
    // Проверка 3: период не пересекается с другими бронированиями
    const where: FindOptionsWhere<Booking> = {
      listing: { id: listingId },
      status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE]),
      period: Raw((alias) => `${alias} && tstzrange(:start, :end)`, { 
        start: startDate.toISOString(), 
        end: endDate.toISOString() 
      })
    };
    if (excludeBookingId) {
      where.id = Not(excludeBookingId);
    }
    const overlapping = await this.bookingRepository.exists({ where });
    if (overlapping) {
      throw new ConflictException('Listing is not available for the selected period');
    }
  }


  private calculateDuration(start: Date, end: Date, pricePeriod: ListingPeriodType): number {
    const ms = end.getTime() - start.getTime();
    switch (pricePeriod) {
      // case ListingPeriodType.HOUR:  return Math.ceil(ms / (1000 * 60 * 60));
      // case ListingPeriodType.DAY:   return Math.ceil(ms / (1000 * 60 * 60 * 24));
      // case ListingPeriodType.WEEK:  return Math.ceil(ms / (1000 * 60 * 60 * 24 * 7));
      // case ListingPeriodType.MONTH: return Math.ceil(ms / (1000 * 60 * 60 * 24 * 30));
      case ListingPeriodType.HOUR:  return (ms / (1000 * 60 * 60));
      case ListingPeriodType.DAY:   return (ms / (1000 * 60 * 60 * 24));
      case ListingPeriodType.WEEK:  return (ms / (1000 * 60 * 60 * 24 * 7));
      case ListingPeriodType.MONTH: return (ms / (1000 * 60 * 60 * 24 * 30));
      default: throw new BadRequestException('Unknown price period');
    }
  }
}
