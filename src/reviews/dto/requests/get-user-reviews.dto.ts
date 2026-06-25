import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRoleType } from '../../../common/enums/user-role-type.enum';

export class GetUserReviewsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: UserRoleType,
    description: 'Фильтр по роли пользователя в сделке. Если не передан — вернутся все отзывы о нём.',
  })
  @IsOptional()
  @IsEnum(UserRoleType)
  role?: UserRoleType;
}
