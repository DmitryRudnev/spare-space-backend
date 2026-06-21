import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Patch, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpCode, 
  UseFilters,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../common/decorators/user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { DomainExceptionFilter } from '../shared/filters/domain-exception.filter';

import { ChatService } from './chat.service';
import { UserRoleType } from '../common/enums/user-role-type.enum';
import { ConversationMapper } from './mappers/conversation.mapper';
import { MessageMapper } from './mappers/message.mapper';

import {
  CreateConversationDto,
  DeleteConversationDto,
  SearchConversationsDto,
  SearchMessagesDto,
} from './dto/requests';

import {
  ConversationResponseDto,
  ConversationsListResponseDto,
  MessagesListResponseDto,
} from './dto/responses';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleType.RENTER, UserRoleType.LANDLORD)
@UseFilters(DomainExceptionFilter)
@ApiTags('Chat')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Не авторизован' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение списка бесед пользователя' })
  @ApiOkResponse({ type: ConversationsListResponseDto, description: 'Список бесед пользователя' })
  async findConversations(
    @Query() dto: SearchConversationsDto, 
    @User('userId') userId: number
  ): Promise<ConversationsListResponseDto> {
    const result = await this.chatService.getConversationsPreviews(userId, dto.limit, dto.offset);
    return ConversationMapper.toListResponseDto(
      result.previews,
      result.total,
      result.limit,
      result.offset,
      userId,
    );
  }

  @Get('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение беседы по ID' })
  @ApiParam({ type: Number, name: 'id', description: 'ID беседы', example: 1 })
  @ApiOkResponse({ type: ConversationResponseDto, description: 'Детали беседы' })
  @ApiNotFoundResponse({ description: 'Беседа не найдена' })
  async findConversationById(
    @Param('id') conversationId: string,
    @User('userId') userId: number
  ): Promise<ConversationResponseDto> {
    await this.chatService.verifyConversationAccess(Number(conversationId), userId)
    const preview = await this.chatService.getConversationPreview(Number(conversationId), userId);
    return ConversationMapper.toResponseDto(preview, userId);
  }

  @Get('conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение сообщений беседы' })
  @ApiParam({ type: Number, name: 'id', description: 'ID беседы', example: 1 })
  @ApiOkResponse({ type: MessagesListResponseDto, description: 'Список сообщений беседы' })
  @ApiNotFoundResponse({ description: 'Беседа не найдена' })
  async findMessages(
    @Param('id') conversationId: string,
    @Query() getMessagesDto: SearchMessagesDto,
    @User('userId') userId: number
  ): Promise<MessagesListResponseDto> {
    await this.chatService.verifyConversationAccess(Number(conversationId), userId)
    const result = await this.chatService.findMessages(Number(conversationId), getMessagesDto.limit, getMessagesDto.offset);
    return MessageMapper.toListResponseDto(
      result.messages,
      result.total,
      result.limit,
      result.offset
    );
  }

  @Post('conversations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Создание новой или получение существующей беседы' })
  @ApiOkResponse({ type: ConversationResponseDto, description: 'Беседа успешно создана или получена' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async getOrCreateConversation(
    @Body() createConversationDto: CreateConversationDto,
    @User('userId') currentUserId: number
  ): Promise<ConversationResponseDto> {
    const preview = await this.chatService.getOrCreateConversation(
      currentUserId,
      createConversationDto.participantId,
      createConversationDto.listingId
    );
    return ConversationMapper.toResponseDto(preview, currentUserId);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удаление беседы (по умолчанию soft-delete)' })
  @ApiParam({ type: Number, name: 'id', description: 'ID беседы', example: 1 })
  @ApiOkResponse({ description: 'Беседа успешно удалена' })
  @ApiNotFoundResponse({ description: 'Беседа не найдена' })
  async deleteConversation(
    @Param('id') conversationId: string,
    @User('userId') userId: number,
    @Body() dto?: DeleteConversationDto
  ): Promise<void> {
    await this.chatService.verifyConversationAccess(Number(conversationId), userId)
    await this.chatService.deleteConversation(Number(conversationId), dto?.permanent);
  }

  @Patch('conversations/:id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Восстановление беседы' })
  @ApiParam({ type: Number, name: 'id', description: 'ID беседы', example: 1 })
  @ApiOkResponse({ description: 'Беседа успешно восстановлена' })
  @ApiNotFoundResponse({ description: 'Беседа не найдена' })
  async restoreConversation(
    @Param('id') conversationId: string,
    @User('userId') userId: number
  ): Promise<void> {
    await this.chatService.verifyConversationAccess(Number(conversationId), userId);
    await this.chatService.restoreConversation(Number(conversationId));
  }
}
