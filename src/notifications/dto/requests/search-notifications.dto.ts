import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

import { NotificationType } from '../../../common/enums/notification-type.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchNotificationsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: NotificationType,
    description: 'Тип уведомления',
    example: NotificationType.BOOKING_NEW
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Статус прочтения',
    example: false
  })
  @IsOptional()
  @Transform(({ obj, key }) => {
    // Получаем сырое значение из объекта до того, как его испортит Implicit Conversion
    // (Implicit Conversion будет преоразовывать любые строки в true)
    const rawValue = obj[key];
    if (rawValue === true || rawValue === 'true' || rawValue === '1') return true;
    if (rawValue === false || rawValue === 'false' || rawValue === '0') return false;
    return rawValue;
  })
  @IsBoolean()
  isRead?: boolean;
}
