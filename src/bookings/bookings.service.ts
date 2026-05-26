import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, Raw, Not } from 'typeorm';

import { ListingsService } from '../listings/listings.service';
import { Booking } from '../entities/booking.entity';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';
import { UserRoleType } from '../common/enums/user-role-type.enum';

import { CreateBookingDto } from './dto/requests/create-booking.dto';
import { SearchBookingsDto } from './dto/requests/search-bookings.dto';
import { UpdateBookingPeriodDto } from './dto/requests/update-booking-period.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    private readonly listingsService: ListingsService,
  ) {}

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
    const { listingId, pricePeriod, startDate, periodsCount } = createDto;

    const listing = await this.listingsService.findByIdWithCache(listingId);
    if (listing.status !== ListingStatus.ACTIVE) throw new BadRequestException('Cannot book an inactive listing');
    if (renterId === listing.user.id) throw new BadRequestException('Cannot book owned listing');
    
    if (startDate.getSeconds() !== 0 || startDate.getMilliseconds() !== 0) {
      throw new BadRequestException('Start date must be a multiple of one minute (no seconds or milliseconds allowed)');
    }

    const endDate = this.calculateEndDate(startDate, pricePeriod, periodsCount);
    await this.validateBookingDates(startDate, endDate, listing.id, listing.availability);

    const selectedPricing = listing.pricings.find(p => p.pricePeriod === createDto.pricePeriod);
    if (!selectedPricing) {
      throw new BadRequestException(`Listing does not support ${createDto.pricePeriod} pricing`);
    }

    const totalPrice = selectedPricing.price * periodsCount;
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
    const { startDate, periodsCount, pricePeriod } = updatePeriodDto;
    if (startDate.getSeconds() !== 0 || startDate.getMilliseconds() !== 0) {
      throw new BadRequestException('Start date must be a multiple of one minute (no seconds or milliseconds allowed)');
    }

    const booking = await this.findById(bookingId);
    if (booking.pricePeriod !== pricePeriod) {
      const selectedPricing = booking.listing.pricings.find(p => p.pricePeriod === pricePeriod);
      if (!selectedPricing) {
        throw new BadRequestException(`Listing does not support ${pricePeriod} pricing`);
      }
      booking.pricePeriod = selectedPricing.pricePeriod;
      booking.price = selectedPricing.price;
    }

    const endDate = this.calculateEndDate(startDate, booking.pricePeriod, periodsCount);
    await this.validateBookingDates(startDate, endDate, booking.listing.id, booking.listing.availability, bookingId);

    booking.period = `[${startDate.toISOString()},${endDate.toISOString()})`;
    booking.totalPrice = booking.price * periodsCount;

    return this.bookingRepository.save(booking);
  }

  async updateStatus(bookingId: number, newStatus: BookingStatus): Promise<Booking> {
    const booking = await this.findById(bookingId);
    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }

  async delete(booking: Booking): Promise<void> {
    await this.bookingRepository.remove(booking);
  }

  async validateUserParticipation(bookingId: number, userId: number): Promise<void> {
    const booking = await this.findById(bookingId);
    const isRenter = booking.renter.id === userId;
    const isLandlord = booking.listing.user.id === userId;

    if (!isRenter && !isLandlord) {
      throw new UnauthorizedException('User is not a participant of this booking');
    }
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

    // Проверка 2: диапазон бронирования должен укладываться в периоды доступности объявления
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
    
    // Проверка 3: период должен не пересекаться с другими бронированиями
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

  private calculateEndDate(startDate: Date, pricePeriod: ListingPeriodType, periodsCount: number): Date {
    const end = new Date(startDate.getTime());
    switch (pricePeriod) {
      case ListingPeriodType.HOUR:
        end.setHours(end.getHours() + periodsCount);
        break;
      case ListingPeriodType.DAY:
        end.setDate(end.getDate() + periodsCount);
        break;
      case ListingPeriodType.WEEK:
        end.setDate(end.getDate() + periodsCount * 7);
        break;
      case ListingPeriodType.MONTH:
        end.setMonth(end.getMonth() + periodsCount);
        break;
      default:
        throw new BadRequestException('Unknown price period');
    }
    return end;
  }
}
