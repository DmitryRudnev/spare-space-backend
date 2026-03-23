import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserSubscriptionDto {
  @ApiProperty({
    example: 1,
    description: 'ID тарифного плана, который покупает пользователь',
  })
  @IsInt()
  @Min(1)
  planId: number;

  @ApiProperty({
    example: '2025-04-01T00:00:00.000Z',
    description: 'Дата начала подписки (ISO 8601)',
  })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({
    example: 1,
    description: 'Длительность подписки в месяцах (null = бессрочно)',
    nullable: true,
  })
  @IsInt()
  @Min(1)
  monthsCount: number | null;
}
