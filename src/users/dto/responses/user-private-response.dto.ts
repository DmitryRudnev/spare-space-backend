import { ApiProperty } from '@nestjs/swagger';
import { UserPublicResponseDto } from './user-public-response.dto';

export class UserPrivateResponseDto extends UserPublicResponseDto {
  @ApiProperty({ type: String, description: 'Телефон', example: '+78005553535' })
  phone: string;

  @ApiProperty({ type: String, description: 'Email', example: 'user@example.com' })
  email: string | null;

  @ApiProperty({ type: Boolean, description: 'Включена ли двухфакторная аутентификация', example: false })
  twoFaEnabled: boolean;

  @ApiProperty({ type: Number, description: 'Telegram ID', example: 123456789, nullable: true })
  telegramId: number | null;

  @ApiProperty({ type: String, description: 'Имя пользователя Telegram', example: '@username', nullable: true })
  telegramUsername: string | null;

  @ApiProperty({ type: String, description: 'Дата обновления (ISO8601)', example: '2025-01-02T00:00:00.000Z' })
  updatedAt: string;
}
