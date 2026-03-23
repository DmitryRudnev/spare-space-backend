import { User } from '../../entities/user.entity';
import { UserPublicResponseDto } from '../dto/responses/user-public-response.dto';
import { UserPrivateResponseDto } from '../dto/responses/user-private-response.dto';

export class UserMapper {
  static toPublicResponseDto(user: User): UserPublicResponseDto {
    const dto = new UserPublicResponseDto();
    
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.patronymic = user.patronymic;
    dto.rating = user.rating;
    dto.verified = user.verified;
    dto.isOnline = user.isOnline;
    dto.lastSeenAt = user.lastSeenAt.toISOString();
    dto.createdAt = user.createdAt.toISOString();
    
    return dto;
  }

  static toPrivateResponseDto(user: User): UserPrivateResponseDto {
    const dto = new UserPrivateResponseDto();
    const baseDto = this.toPublicResponseDto(user);
    Object.assign(dto, baseDto);
    
    dto.email = user.email;
    dto.phone = user.phone;
    dto.twoFaEnabled = user.twoFaEnabled;
    dto.updatedAt = new Date(user.updatedAt).toISOString();

    return dto;
  }
}
