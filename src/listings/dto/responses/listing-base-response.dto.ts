import { ApiProperty } from '@nestjs/swagger';
import { ListingPeriodType } from '../../../common/enums/listing-period-type.enum';
import { ListingType } from '../../../common/enums/listing-type.enum';
import { ListingStatus } from '../../../common/enums/listing-status.enum';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';

export class ListingBaseResponseDto {
  @ApiProperty({ type: Number, description: 'ID объявления', example: 1 })
  id: number;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Пользователь, создавший объявление' })
  user: UserPublicResponseDto;

  @ApiProperty({ enum: ListingStatus, description: 'Статус объявления', example: ListingStatus.ACTIVE })
  status: ListingStatus;

  @ApiProperty({  enum: ListingType,  description: 'Тип объявления',  example: ListingType.PARKING })
  type: ListingType;

  @ApiProperty({ type: String, description: 'Заголовок объявления', example: 'Просторный паркинг в центре' })
  title: string;

  @ApiProperty({ type: Number, description: 'Размер в квадратных метрах', example: 5.5, nullable: true })
  size: number | null;

  @ApiProperty({ type: Number, description: 'Цена за период', example: 1500 })
  price: number;

  @ApiProperty({ enum: ListingPeriodType, description: 'Период ценообразования', example: ListingPeriodType.DAY })
  pricePeriod: ListingPeriodType;

  @ApiProperty({ type: String, description: 'Адрес', example: 'Москва, ул. Пушкина, д. Колотушкина' })
  address: string;

  @ApiProperty({ type: Number, description: 'Количество просмотров', example: 100 })
  viewsCount: number;

  @ApiProperty({ type: Number, description: 'Количество репостов', example: 10 })
  repostsCount: number;

  @ApiProperty({ type: Number, description: 'Количество добавлений в избранное', example: 5 })
  favoritesCount: number;

  @ApiProperty({ type: String, description: 'Дата создания объявления (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ type: String, description: 'Дата обновления объявления (ISO8601)', example: '2025-01-02T00:00:00.000Z' })
  updatedAt: string;
}
