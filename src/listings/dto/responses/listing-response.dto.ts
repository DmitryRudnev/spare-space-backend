import { ApiProperty } from '@nestjs/swagger';
import { ListingBaseResponseDto } from './listing-base-response.dto';

export class ListingResponseDto extends ListingBaseResponseDto {
  @ApiProperty({ type: String, description: 'URL первой фотографии', example: 'https://example.com/photo1.jpg', nullable: true })
  firstPhotoUrl: string | null;
}
