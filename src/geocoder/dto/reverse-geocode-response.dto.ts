import { ApiProperty } from '@nestjs/swagger';

export class ReverseGeocodeResponseDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Адрес, найденный по координатам',
    example: 'г Москва, ул Манежная, д 1',
  })
  address: string | null;
}
