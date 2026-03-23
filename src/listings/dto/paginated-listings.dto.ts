import { Type } from 'class-transformer';
import { Listing } from '../../entities/listing.entity';

export class PaginatedListingsDto {
  @Type(() => Listing)
  listings: Listing[];
  total: number;
  limit: number;
  offset: number;
}
