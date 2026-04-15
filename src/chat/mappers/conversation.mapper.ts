import { UserMapper } from '../../users/mappers/user.mapper';
import { ListingMapper } from '../../listings/mappers/listing.mapper';
import { MessageMapper } from './message.mapper';
import {
  ConversationResponseDto,
  ConversationsListResponseDto,
} from '../dto/responses';
import { ConversationPreview } from '../chat.service';

export class ConversationMapper {
  static toResponseDto(preview: ConversationPreview, currentUserId: number): ConversationResponseDto {
    const { conversation, lastMessage, unreadsCount } = preview;
    const dto = new ConversationResponseDto();
    const companionUser = currentUserId === Number(conversation.participant1.id)
      ? conversation.participant2
      : conversation.participant1;
    
    dto.id = conversation.id;
    dto.companion =  UserMapper.toPublicResponseDto(companionUser);
    dto.listing = conversation.listing ? ListingMapper.toResponseDto(conversation.listing) : null;
    dto.lastMessage = lastMessage ? MessageMapper.toResponseDto(lastMessage) : null;
    dto.unreadsCount = unreadsCount;
    dto.createdAt = new Date(conversation.createdAt).toISOString();

    return dto;
  }

  static toListResponseDto(
    previews: ConversationPreview[], 
    total: number, 
    limit: number, 
    offset: number,
    currentUserId: number
  ): ConversationsListResponseDto {
    const dto = new ConversationsListResponseDto();
    
    dto.conversations = previews.map(preview => this.toResponseDto(preview, currentUserId));
    dto.total = total;
    dto.limit = limit;
    dto.offset = offset;

    return dto;
  }
}
