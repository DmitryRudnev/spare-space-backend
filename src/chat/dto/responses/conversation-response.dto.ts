import { ApiProperty } from '@nestjs/swagger';
import { ListingResponseDto } from '../../../listings/dto/responses/listing-response.dto';
import { UserPublicResponseDto } from '../../../users/dto/responses/user-public-response.dto';
import { MessageResponseDto } from './message-response.dto';

export class ConversationResponseDto {
  @ApiProperty({ description: 'ID беседы', example: 5 })
  id: number;

  @ApiProperty({ type: UserPublicResponseDto, description: 'Собеседник' })
  companion: UserPublicResponseDto;

  @ApiProperty({ type: ListingResponseDto, description: 'Данные объявления', nullable: true })
  listing: ListingResponseDto | null;

  @ApiProperty({ type: MessageResponseDto, description: 'Последнее сообщение', nullable: true })
  lastMessage: MessageResponseDto | null;
  
  @ApiProperty({ type: Number, description: 'Количество непрочитанных сообщений', example: 7 })
  unreadsCount: number;

  @ApiProperty({ description: 'Дата создания беседы (ISO8601)', example: '2025-01-01T00:00:00.000Z' })
  createdAt: string;
}
