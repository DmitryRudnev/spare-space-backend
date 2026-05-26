import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ListingStatus } from '../../../common/enums/listing-status.enum';

export class UpdateListingStatusDto {
  @ApiProperty({
    enum: ListingStatus,
    description: 'Новый статус объявления',
    example: ListingStatus.ACTIVE,
  })
  @IsEnum(ListingStatus)
  status: ListingStatus;
}
