import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({
    type: Number,
    description: 'ID объявления для добавления в избранное',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  listingId: number;
}
