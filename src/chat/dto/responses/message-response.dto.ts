import { ApiProperty } from '@nestjs/swagger';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';

export class MessageResponseDto {
  @ApiProperty({ type: Number, description: 'ID сообщения', example: 1 })
  id: number;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Автор сообщения' })
  sender: UserPublicResponseDto;

  @ApiProperty({ type: String, description: 'Текст сообщения', example: 'Когда можно заехать?' })
  text: string;

  @ApiProperty({ type: Boolean, description: 'Прочитано ли сообщение', example: true })
  isRead: boolean;

  @ApiProperty({ type: String, description: 'Дата отправки (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  sentAt: string;
}
