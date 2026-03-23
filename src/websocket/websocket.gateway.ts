import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger, Injectable, UseFilters } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { AuthenticatedSocket } from './interfaces/socket.interface';
import { WsResponseFactory } from './factories/ws-response.factory';
import { WsExceptionsFilter } from './filters/ws-exception.filter';
import { WsAuthMiddleware } from './middlewares/ws-auth.middleware';
import { ChatService } from '../chat/chat.service';
import { MessageMapper } from '../chat/mappers/message.mapper';
import { MessageResponseDto } from '../chat/dto/responses/message-response.dto';
import { UsersService } from '../users/services/users.service';
import { NotificationType } from '../common/enums/notification-type.enum';

import {
  WsConversationSubscribeRequestDto,
  WsConversationUnsubscribeRequestDto,
  WsMessageSendRequestDto,
  WsMessageReadRequestDto,
  WsUserStatusSubscribeRequestDto,
  WsUserStatusUnsubscribeRequestDto,
  WsMessageEditRequestDto,
  WsMessageDeleteRequestDto,
} from './dto/requests';
import {
  WsMessageReadUpdateResponseDto,
  WsResponseDto,
  WsMessageNewResponseDto,
  WsUserStatusUpdateResponseDto,
  WsMessageEditedResponseDto,
  WsMessageDeletedResponseDto,
  // WsUnreadsCountResponseDto,
  WsConversationPreviewUpdateResponseDto,
  WsNotificationNewResponseDto,
} from './dto/responses';


@UseFilters(WsExceptionsFilter)
@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: true,
    credentials: true,
    transports: ['websocket', 'polling'],
  },
  pingTimeout: 30000, // 30 секунд таймаут для ping/pong
  pingInterval: 10000, // отправлять ping каждые 10 секунд
})
@Injectable()
export class MainWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MainWebSocketGateway.name);
  @WebSocketServer() private server: Server;
  private readonly offlineTimers = new Map<number, NodeJS.Timeout>();
  private readonly OFFLINE_DELAY = 5000; // 5 секунд задержки

  constructor(
    private readonly wsAuthMiddleware: WsAuthMiddleware,
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}


  afterInit(server: Server) {
    this.logger.log('WebSocket gateway initialized');    
    server.use((socket: Socket, next) => {
      this.wsAuthMiddleware.use(socket as AuthenticatedSocket, next);
    });
  }


  async handleConnection(client: AuthenticatedSocket) {
    const userId = client.data.user.userId;
    this.logger.log(`Client ${client.id} (user ${userId}) connectened to the websocket`);
    const userRoom = `user:${userId}`;
    const isReconnecting = this.offlineTimers.has(userId);

    // Отменяем таймер офлайна, если он был запущен
    if (isReconnecting) {
      clearTimeout(this.offlineTimers.get(userId));
      this.offlineTimers.delete(userId);
    }
    
    await client.join(userRoom);
    this.logger.log(`Client ${client.id} (user ${userId}) joined room ${userRoom}`);

    // Шлем Online только если:
    // 1. Это первый сокет
    // 2. И это НЕ быстрое переподключение (таймера не было, юзер реально был Offline)
    const sockets = await this.server.in(userRoom).fetchSockets();
    if (sockets.length === 1 && !isReconnecting) {
      await this.usersService.updateOnlineStatus(userId, true);
      this.notifyUserStatusUpdate(userId, true, new Date());
    }
  }


  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.user.userId;
    this.logger.log(`Client ${client.id} (user ${userId}) disconnectened from the websocket`);

    const sockets = await this.server.in(`user:${userId}`).fetchSockets();
    
    // Если сокетов в комнате не осталось — планируем переход в офлайн
    if (sockets.length === 0) {
      const timer = setTimeout(async () => {
        await this.usersService.updateOnlineStatus(userId, false);
        this.notifyUserStatusUpdate(userId, false, new Date());
        this.offlineTimers.delete(userId);
      }, this.OFFLINE_DELAY);

      this.offlineTimers.set(userId, timer);
    }
  }


  @SubscribeMessage('conversation:subscribe')
  async handleConversationSubscribe(
    @MessageBody() data: WsConversationSubscribeRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      await this.chatService.verifyConversationAccess(data.conversationId, client.data.user.userId);
      await client.join(`conversation:${data.conversationId}`);
      this.logger.log(`User ${client.data.user.userId} joined room conversation:${data.conversationId}`);
      return WsResponseFactory.success();
    } 
    catch (error) {
      return WsResponseFactory.error(error);
    }
  }


  @SubscribeMessage('conversation:unsubscribe')
  async handleConversationUnsubscribe(
    @MessageBody() data: WsConversationUnsubscribeRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      await client.leave(`conversation:${data.conversationId}`);
      this.logger.log(`User ${client.data.user.userId} left room conversation:${data.conversationId}`);
      return WsResponseFactory.success();
    } 
    catch (error) {
      return WsResponseFactory.error(error);
    }
  }


  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: WsMessageSendRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const senderId = client.data.user.userId;
      await this.chatService.verifyConversationAccess(data.conversationId, senderId);

      const message = await this.chatService.sendMessage(data.conversationId, senderId, data.text);
      const messageDto = MessageMapper.toResponseDto(message);
      const recipientId = await this.chatService.getOtherParticipantId(data.conversationId, senderId);

      await this.emitMessageNew(data.conversationId, recipientId, messageDto, client);  
      return WsResponseFactory.successWithData({ message: messageDto });
    } 
    catch (error) {
      return WsResponseFactory.error(error);
    }
  }


  @SubscribeMessage('message:read')
  async handleReadMessages(
    @MessageBody() data: WsMessageReadRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const userId = client.data.user.userId;
      const { conversationId, messageIds } = data;
      await this.chatService.verifyConversationAccess(conversationId, userId);

      const lastMessageReadBefore = (await this.chatService.getLastMessage(conversationId))?.isRead;
      await this.chatService.markMessagesAsRead(conversationId, userId, messageIds);
      const lastMessageRead = (await this.chatService.getLastMessage(conversationId))?.isRead;

      // Если прочитано последнее сообщение, обновляем превью у отправителя
      if (lastMessageRead !== lastMessageReadBefore) {
        const recipientId = await this.chatService.getOtherParticipantId(conversationId, userId);
        await this.notifyConversationPreviewUpdate(recipientId, conversationId);
        await this.notifyConversationPreviewUpdate(userId, conversationId);
      }

      client.to(`conversation:${conversationId}`).emit('message:read:update', {
        conversationId,
        userId: userId,
        messageIds,
      } as WsMessageReadUpdateResponseDto);
      this.logger.log(`User ${userId} emitted message:read:update to room conversation:${conversationId}`);
      return WsResponseFactory.success();
    } 
    catch (error) {
      return WsResponseFactory.error(error);
    }
  }


  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @MessageBody() data: WsMessageEditRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const userId = client.data.user.userId;
      const { conversationId, messageId, newText } = data;
      await this.chatService.verifyConversationAccess(conversationId, userId);
      await this.chatService.verifyMessageOwnership([messageId], conversationId, userId);

      const message = await this.chatService.editMessage(messageId, newText);
      const messageDto = MessageMapper.toResponseDto(message);

      const lastMessageId = await this.chatService.getLastMessageId(conversationId);
      if (lastMessageId === messageId) {
        const recipientId = await this.chatService.getOtherParticipantId(conversationId, userId);
        await this.notifyConversationPreviewUpdate(recipientId, conversationId);
        await this.notifyConversationPreviewUpdate(userId, conversationId);
      }

      client.to(`conversation:${conversationId}`).emit('message:edited', { 
        conversationId, 
        message: messageDto 
      } as WsMessageEditedResponseDto);
      this.logger.log(`User ${userId} emitted message:edited to room conversation:${conversationId}`);
      return WsResponseFactory.successWithData({ message: messageDto });
    }
    catch (error) {
      return WsResponseFactory.error(error);
    }
  }


  @SubscribeMessage('message:delete')
  async handleDeleteMessages(
    @MessageBody() data: WsMessageDeleteRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const userId = client.data.user.userId;
      const { conversationId, messageIds } = data;
      await this.chatService.verifyMessageOwnership(messageIds, conversationId, userId);

      const unreadIdsBefore = await this.chatService.getUnreadMessageIds(conversationId, userId, true);
      const hasDeletedUnread = messageIds.some(id => unreadIdsBefore.includes(id));
      const lastMessageIdBefore = await this.chatService.getLastMessageId(conversationId);
      const isLastDeleted = lastMessageIdBefore ? messageIds.includes(lastMessageIdBefore) : false;

      await this.chatService.deleteMessages(messageIds, conversationId);

      if (isLastDeleted || hasDeletedUnread) {
        const recipientId = await this.chatService.getOtherParticipantId(conversationId, userId);
        await this.notifyConversationPreviewUpdate(recipientId, conversationId);
        await this.notifyConversationPreviewUpdate(userId, conversationId);
      }

      client.to(`conversation:${conversationId}`).emit('message:deleted', {
        conversationId,
        deletedMessageIds: messageIds
      } as WsMessageDeletedResponseDto);
      this.logger.log(`User ${userId} emitted message:deleted to room conversation:${conversationId}`);
      return WsResponseFactory.success();
    } 
    catch (error) {
      return WsResponseFactory.error(error);
    }
  }


  private async emitMessageNew(
    conversationId: number, 
    recipientId: number, 
    messageDto: MessageResponseDto,
    senderSocket: AuthenticatedSocket,
  ): Promise<void> {
    await this.notifyConversationPreviewUpdate(recipientId, conversationId);
    await this.notifyConversationPreviewUpdate(senderSocket.data.user.userId, conversationId);

    // Всегда отправляем в комнату беседы - на тот случай, если отправитель сидит в этом же чате с другого устройства
    const conversationRoom = `conversation:${conversationId}`;
    senderSocket.to(conversationRoom).emit('message:new', { 
      conversationId,
      message: messageDto
    } as WsMessageNewResponseDto);
    this.logger.log(`User ${senderSocket.data.user.userId} emitted message:new to room ${conversationRoom}`);

    // const unreadIds = await this.chatService.getUnreadMessageIds(conversationId, recipientId, false);
    // senderSocket.to(conversationRoom).emit('unreads:count', { 
    //   conversationId, 
    //   unreadsCount: unreadIds.length 
    // } as WsUnreadsCountResponseDto);
    // this.logger.log(`User ${senderSocket.data.user.userId} emitted unreads:count to room ${conversationRoom}`);
    
    const conversationSockets = await this.server.in(conversationRoom).fetchSockets();
    const isInConversation = conversationSockets.some(
      (s) => (s as unknown as AuthenticatedSocket).data.user.userId == recipientId
    );
    if (!isInConversation) {
      // Если пользователя нет в конкретном чате — делегируем всё системе уведомлений
      const conversation = await this.chatService.findConversationById(conversationId);
      this.eventEmitter.emit('notification.signal', {
        userId: recipientId,
        type: NotificationType.MESSAGE_NEW,
        referenceId: conversationId, // ID чата, чтобы фронтенд знал куда перейти
        payload: {
          messageId: messageDto.id,
          conversationId,
          senderId: messageDto.sender.id,
          senderName: messageDto.sender.firstName,
          text: messageDto.text,
          listingId: conversation.listing?.id,
          listingTitle: conversation.listing?.title,
        },
      });
    }
  }


  private async notifyConversationPreviewUpdate(userId: number, conversationId: number): Promise<void> {
    const lastMessage = await this.chatService.getLastMessage(conversationId);
    const unreadIds = await this.chatService.getUnreadMessageIds(conversationId, userId, false);
    
    this.server.to(`user:${userId}`).emit('conversation:preview:update', {
      conversationId,
      unreadsCount: unreadIds.length,
      lastMessage: lastMessage ? MessageMapper.toResponseDto(lastMessage) : null
    } as WsConversationPreviewUpdateResponseDto);
    this.logger.log(`conversation:preview:update emitted to room user:${userId}`);
  }


  @SubscribeMessage('user:status:subscribe')
  async handleUserStatusSubscribe(
    @MessageBody() data: WsUserStatusSubscribeRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const subscriberId = client.data.user.userId;
      const { userId: targetUserId } = data;
      await this.usersService.validateExistence(targetUserId);

      client.join(`user:status:${targetUserId}`);      
      this.logger.log(`User ${subscriberId} joined room user:status:${targetUserId}`);
      return WsResponseFactory.success();
    }
    catch (error) {
      this.logger.error(`Error in user:status:subscribe: ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }


  @SubscribeMessage('user:status:unsubscribe')
  async handleUserStatusUnsubscribe(
    @MessageBody() data: WsUserStatusUnsubscribeRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<WsResponseDto> {
    try {
      const subscriberId = client.data.user.userId;
      const { userId: targetUserId } = data;

      client.leave(`user:status:${targetUserId}`);
      this.logger.log(`User ${subscriberId} left room user:status:${targetUserId}`);
      return WsResponseFactory.success();
    }
    catch (error) {
      this.logger.error(`Error in user:status:unsubscribe: ${error.message}`);
      return WsResponseFactory.error(error);
    }
  }

  
  private async notifyUserStatusUpdate(
    userId: number, 
    isOnline: boolean, 
    lastSeenAt: Date
  ): Promise<void> {
    try {
      this.server.to(`user:status:${userId}`).emit('user:status:update', {
        userId,
        isOnline,
        lastSeenAt: lastSeenAt.toISOString(),
      } as WsUserStatusUpdateResponseDto);
      this.logger.log(`user:status:update(isOnline: ${isOnline}) emitted to room user:status:${userId}`);
    }
    catch (error) {
      this.logger.error(`Failed to notify status update for user ${userId}: ${error.message}`);
    }
  }


  async isOnline(userId: number): Promise<boolean> {
    return (await this.server.in(`user:${userId}`).fetchSockets()).length > 0;
  }


  async sendNotificationToUser(userId: number, payload: WsNotificationNewResponseDto): Promise<void> {
    this.server.to(`user:${userId}`).emit('notification:new', payload);
    this.logger.log(`notification:new emitted to room user:${userId}`);
  }
}
