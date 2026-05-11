import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../../common/enums/booking-status.enum';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';
import { PeriodDto } from '../../../common/dto/period.dto';
import { ListingType } from '../../../common/enums/listing-type.enum';

export class BookingResponseDto {
  @ApiProperty({ type: Number, description: 'ID бронирования', example: 1 })
  id: number;

  @ApiProperty({ type: Number, description: 'ID объявления', example: 1 })
  listingId: number;

  @ApiProperty({ enum: ListingType, description: 'Тип объявления', example: ListingType.GARAGE })
  listingType: ListingType;

  @ApiProperty({ type: String, description: 'Заголовок объявления', example: 'Просторный паркинг в центре' })
  listingTitle: string;

  @ApiProperty({ 
    type: String,
    description: 'URL первой фотографии объявления',
    example: 'https://example.com/photo1.jpg',
    nullable: true,
  })
  listingFirstPhotoUrl: string | null;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Арендатор' })
  renter: UserPublicResponseDto;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Владелец объявления' })
  landlord: UserPublicResponseDto;

  @ApiProperty({ type: Number, description: 'Общая цена', example: 15000 })
  totalPrice: number;

  @ApiProperty({ enum: BookingStatus, description: 'Статус бронирования', example: BookingStatus.PENDING })
  status: BookingStatus;

  @ApiProperty({ type: PeriodDto, description: 'Период бронирования' })
  period: PeriodDto;

  @ApiProperty({ type: String, description: 'Дата создания (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ type: String, description: 'Дата создания (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  updatedAt: string;
}
