import { Message } from '../../entities/message.entity';
import { UserMapper } from '../../users/mappers/user.mapper';
import {
  MessageResponseDto,
  MessagesListResponseDto,
} from '../dto/responses';

export class MessageMapper {
  static toResponseDto(message: Message): MessageResponseDto {
    const dto = new MessageResponseDto();
    
    dto.id = message.id;
    dto.sender = UserMapper.toPublicResponseDto(message.sender);
    dto.text = message.text;
    dto.isRead = message.isRead;
    dto.sentAt = new Date(message.sentAt).toISOString();

    return dto;
  }

  static toListResponseDto(
    messages: Message[], 
    total: number, 
    limit: number, 
    offset: number
  ): MessagesListResponseDto {
    const dto = new MessagesListResponseDto();
    
    dto.messages = messages.map(message => this.toResponseDto(message));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
}
