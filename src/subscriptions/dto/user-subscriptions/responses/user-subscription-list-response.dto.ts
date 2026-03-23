import { ApiProperty } from '@nestjs/swagger';
import { UserSubscriptionResponseDto } from './user-subscription-response.dto';

export class UserSubscriptionListResponseDto {
  @ApiProperty({ type: [UserSubscriptionResponseDto], description: 'Массив подписок пользователя' })
  subscriptions: UserSubscriptionResponseDto[];

  @ApiProperty({ example: 100, description: 'Общее количество подписок (с учётом фильтра)' })
  total: number;

  @ApiProperty({ example: 10, description: 'Лимит на страницу' })
  limit: number;

  @ApiProperty({ example: 0, description: 'Смещение' })
  offset: number;
}
