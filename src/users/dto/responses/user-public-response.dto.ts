import { ApiProperty } from '@nestjs/swagger';

export class UserPublicResponseDto {
  @ApiProperty({ type: Number, description: 'ID пользователя', example: 1 })
  id: number;

  @ApiProperty({ type: String, description: 'Имя', example: 'Иван' })
  firstName: string;

  @ApiProperty({ type: String, description: 'Фамилия', example: 'Иванов' })
  lastName: string;

  @ApiProperty({ type: String, nullable: true, description: 'Отчество', example: 'Иванович' })
  patronymic: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Ссылка на фотографию профиля', example: 'https://example.com/avatar1.jpg' })
  avatarUrl: string | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Рейтинг', example: 4.8 })
  rating: number | null;

  @ApiProperty({ type: Boolean, description: 'Верифицирован ли пользователь', example: true })
  verified: boolean;

  @ApiProperty({ type: String, description: 'Дата создания (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;
}
