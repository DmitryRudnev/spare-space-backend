import { ApiProperty } from '@nestjs/swagger';

export class AddressSuggestionDto {
  @ApiProperty({
    type: String,
    description: 'Полный отформатированный адрес',
    example: 'г Москва, ул Манежная, д 1',
  })
  address: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Широта (latitude)',
    example: 55.7558,
  })
  latitude: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Долгота (longitude)',
    example: 37.6173,
  })
  longitude: number | null;
}
