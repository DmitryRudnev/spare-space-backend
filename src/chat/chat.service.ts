import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { Repository, In, DataSource, IsNull, FindOperator, FindOptionsWhere, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { UsersService } from '../users/services/users.service';
import { ListingsService } from 'src/listings/listings.service';

import { 
  ConversationNotFoundException, 
  ConversationAccessDeniedException,
  MessageNotFoundException,
  MessageAccessDeniedException
} from '../shared/exceptions/domain.exception';

export interface ConversationPreview {
  conversation: Conversation;
  lastMessage: Message | null;
  unreadsCount: number;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== HTTP CONTROLLER METHODS ====================

  /**
   * Получение предварительного просмотра бесед пользователя с пагинацией
   * 
   * @param userId - ID пользователя
   * @param limit - Количество бесед на странице
   * @param offset - Смещение для пагинации
   * @returns Объект с массивом предварительных просмотров бесед и метаданными пагинации
   */
  async getConversationsPreviews(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{ previews: ConversationPreview[]; total: number; limit: number; offset: number; }> {
    // 1. Получаем пагинированный список бесед
    const { conversations, total } = await this.findConversations(userId, limit, offset);
  
    // 2. Параллельно собираем данные для каждой беседы
    const previews = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await this.getLastMessage(conversation.id);
        const unreadsCount = await this.getUnreadsCount(conversation.id, userId, false);
        return { conversation, lastMessage, unreadsCount };
      })
    );
  
    return { previews, total, limit, offset };
  }

  /**
   * Поиск бесед пользователя с пагинацией
   * @param userId - ID пользователя
   * @param dto - DTO с параметрами пагинации
   * @returns Объект с массивом бесед и метаданными пагинации
   */
  async findConversations(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{ conversations: Conversation[]; total: number; limit: number; offset: number; }> {
    const [conversations, total] = await this.conversationRepository.findAndCount({
      where: [
        { participant1: { id: userId } },
        { participant2: { id: userId } }
      ],
      relations: {
        participant1: true,
        participant2: true,
        listing: { user: true }
      },
      order: { lastMessageAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { conversations, total, limit, offset };
  }

  /**
   * Поиск беседы по ID с проверкой прав доступа
   * @param conversationId - ID беседы
   * @returns Объект беседы
   * @throws ConversationNotFoundException если беседа не найдена
   */
  async findConversationById(conversationId: number): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: {
        participant1: true,
        participant2: true,
        listing: { user: true }
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }

    return conversation;
  }

  /**
   * Получение предварительного просмотра беседы
   * 
   * @param conversationId - ID беседы
   * @param currentUserId - ID текущего пользователя
   * @returns Объект предварительного просмотра беседы
   * @throws ConversationNotFoundException если беседа не найдена
   */
  async getConversationPreview(
    conversationId: number,
    currentUserId: number,
  ): Promise<ConversationPreview> {
    const conversation = await this.findConversationById(conversationId);
    const lastMessage = await this.getLastMessage(conversationId);
    const unreadsCount = await this.getUnreadsCount(conversationId, currentUserId, false);
    return { conversation, lastMessage, unreadsCount };
  }

  /**
   * Проверяет, является ли пользователь участником беседы
   * @param conversationId - ID беседы
   * @param userId - ID пользователя для проверки
   * @throws ConversationAccessDeniedException если пользователь не участник
   */
  async verifyConversationAccess(conversationId: number, userId: number): Promise<void> {
    const conversation = await this.findConversationById(conversationId);

    if (userId !== Number(conversation.participant1.id) && userId !== Number(conversation.participant2.id)) {
      throw new ConversationAccessDeniedException(conversationId, userId);
    }
  }

  /**
   * Поиск сообщений в беседе с пагинацией
   * @param conversationId - ID беседы
   * @param dto - DTO с параметрами пагинации
   * @returns Объект с массивом сообщений и метаданными пагинации
   */
  async findMessages(
    conversationId: number,
    limit: number,
    offset: number,
  ): Promise<{ messages: Message[]; total: number; limit: number; offset: number; }> {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: { 
        sender: true, 
        conversation: true 
      },
      order: { sentAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { messages, total, limit, offset };
  }

  /**
   * Поиск сообщения по ID с проверкой прав доступа
   * @param messageId - ID сообщения
   * @returns Объект сообщения
   * @throws MessageNotFoundException если сообщение не найдено
   * @throws ConversationAccessDeniedException если пользователь не участник беседы
   */
  async findMessageById(messageId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: {
        sender: true,
        conversation: {
          participant1: true,
          participant2: true
        }
      },
    });

    if (!message) {
      throw new MessageNotFoundException(messageId);
    }

    return message;
  }

  /**
   * Создание новой беседы
   * @param currentUserId - ID текущего пользователя
   * @param dto - DTO с данными для создания беседы
   * @returns Созданная беседа
   * @throws BadRequestException при попытке создать беседу с собой
   * @throws ConflictException если беседа уже существует
   */
  async createConversation(
    currentUserId: number,
    companionId: number,
    listingId?: number,
  ): Promise<ConversationPreview> {
    await this.usersService.validateExistence(companionId);

    if (currentUserId === companionId) {
      throw new BadRequestException('Cannot create conversation with self');
    }

    if (listingId) {
      try {
        await this.listingsService.validateListingOwnership(listingId, companionId);
      } catch (error) {
        throw new BadRequestException('Companion must be the listing owner');
      }
    }

    const conversationExists = await this.checkConversationExists(
      currentUserId, 
      companionId, 
      listingId
    );
    if (conversationExists) {
      throw new ConflictException('Conversation already exists');
    }

    const conversation = this.conversationRepository.create({
      participant1: { id: currentUserId },
      participant2: { id: companionId },
      listing: listingId ? { id: listingId } : null
    });

    const savedConversation = await this.conversationRepository.save(conversation);
    return this.getConversationPreview(savedConversation.id, currentUserId);
  }

  /**
   * Удаление или восстановление беседы (мягкое удаление)
   * @param conversationId - ID беседы
   * @param permanent - Флаг полного удаления (true) или восстановления (false)
   * @throws ConversationNotFoundException если беседа не найдена
   * @throws ConversationAccessDeniedException если пользователь не участник
   */
  async deleteConversation(
    conversationId: number, 
    permanent: boolean = false
  ): Promise<void> {   
    if (permanent) {
      // Полное удаление с каскадным удалением сообщений
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.delete(Conversation, { id: conversationId });
        await transactionalEntityManager.delete(Message, { conversation: { id: conversationId } });
      });
    } else {
      // Мягкое удаление
      await this.conversationRepository.softDelete({ id: conversationId });
    }
  }

  /**
   * Восстановление мягко удаленной беседы
   * @param conversationId - ID беседы
   * @throws ConversationNotFoundException если беседа не найдена
   * @throws ConversationAccessDeniedException если пользователь не участник
   */
  async restoreConversation(conversationId: number): Promise<void> {   
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      withDeleted: true
    });

    if (!conversation) {
      throw new ConversationNotFoundException(conversationId);
    }

    await this.conversationRepository.restore({ id: conversationId });
  }


  // ==================== WEBSOCKET GATEWAY METHODS ====================

  /**
   * Отправка сообщения в беседу
   * @param conversationId - ID беседы
   * @param senderId - ID отправителя
   * @param text - Текст сообщения (уже валидирован через DTO)
   * @returns Созданное сообщение
   */
  async sendMessage(
    conversationId: number, 
    senderId: number, 
    text: string
  ): Promise<Message> {
    const message = this.messageRepository.create({
      conversation: { id: conversationId },
      sender: { id: senderId },
      text,
      isRead: false
    });
    const savedMessage = await this.messageRepository.save(message);
    
    await this.conversationRepository.update(
      { id: conversationId },
      { lastMessageAt: new Date() }
    );

    return this.findMessageById(savedMessage.id);
  }

  /**
   * Пометка сообщений как прочитанных
   * @param conversationId - ID беседы
   * @param readerId - ID пользователя
   * @param messageIds - Опциональный массив ID сообщений для пометки
   */
  async markMessagesAsRead(
    conversationId: number, 
    readerId: number, 
    messageIds?: number[]
  ): Promise<void> {
    const where: FindOptionsWhere<Message> = {
      conversation: { id: conversationId },
      isRead: false,
      sender: Not(readerId),
    };

    if (messageIds && messageIds.length > 0) {
      where.id = In(messageIds);
      const messages = await this.messageRepository.find({ where });
      if (messages.length !== messageIds.length) {
        throw new MessageAccessDeniedException(messageIds, conversationId, readerId);
      }
    }

    await this.messageRepository.update(where, { 
      isRead: true,
      readAt: new Date()
    });
  }

  /**
   * Редактирование сообщения
   * @param messageId - ID сообщения для редактирования
   * @param newText - Новый текст сообщения
   * @returns Обновленное сообщение
   */
  async editMessage(
    messageId: number, 
    newText: string
  ): Promise<Message> {
    await this.messageRepository.update(
      { id: messageId },
      { text: newText }
    );
    return this.findMessageById(messageId);
  }

  /**
   * Удаление сообщений и обновление временной метки последнего сообщения в чате
   * @param messageIds - ID сообщений для удаления
   * @param conversationId - ID беседы
   */
  async deleteMessages(
    messageIds: number[],
    conversationId: number,
  ): Promise<void> {

    await this.messageRepository.delete({
      id: In(messageIds)
    });

    const lastMessage = await this.getLastMessage(conversationId);
    await this.conversationRepository.update(
      { id: conversationId }, 
      { lastMessageAt: lastMessage?.sentAt ?? null }
    );
  }

  /**
   * Проверяет, является ли пользователь отправителем сообщения
   * @param messageIds - массив ID сообщений
   * @param conversationId - ID беседы 
   * @param userId - ID отправителя
   * @throws MessageAccessDeniedException
   */
  async verifyMessageOwnership(
    messageIds: number[],
    conversationId: number,
    userId: number,
  ): Promise<void> {
    const messages = await this.messageRepository.find({
      where: { 
        id: In(messageIds),
        conversation: { id: conversationId },
        sender: { id: userId },
      }
    });

    if (messages.length !== messageIds.length) {
      throw new MessageAccessDeniedException(messageIds, conversationId, userId);
    }
  }

  /**
   * Получение последнего сообщения в беседе
   * @param conversationId - ID беседы
   * @returns Последнее сообщение или null если сообщений нет
   */
  async getLastMessage(conversationId: number): Promise<Message | null> {
    const message = await this.messageRepository.findOne({
      where: { conversation: { id: conversationId } },
      relations: { sender: true },
      order: { sentAt: 'DESC' },
    });
    return message;
  }

  /**
   * Получение ID последнего сообщения в беседе
   * @param conversationId - ID беседы
   * @returns ID последнего сообщения или null если сообщений нет
   */
  async getLastMessageId(conversationId: number): Promise<number | null> {
    const message = await this.messageRepository.findOne({
      select: { id: true }, // Выбираем только поле id
      where: { conversation: { id: conversationId } },
      order: { sentAt: 'DESC' },
    });
    return message?.id ?? null;
  }

  /**
   * Возвращает количество непрочитанных сообщений в беседе
   * @param conversationId - ID беседы
   * @param userId - ID пользователя
   * @param isSender - является ли пользователь отправителем непрочитанных сообщений?
   * @returns Количество непрочитанных сообщений
   */
  async getUnreadsCount(
    conversationId: number, 
    userId: number,
    isSender: boolean,
  ): Promise<number> {
    const where: FindOptionsWhere<Message> = {
      conversation: { id: conversationId },
      isRead: false,
    };
    if (isSender) {
      where.sender = { id: userId };
    } else {
      where.sender = Not(userId);
    }
    return this.messageRepository.countBy(where);
  }

  /**
   * Получение массива ID непрочитанных сообщений в беседе
   * @param conversationId - ID беседы
   * @param userId - ID пользователя
   * @param isSender - является ли пользователь отправителем непрочитанных сообщений?
   * @returns Массив ID непрочитанных сообщений
   */
  async getUnreadMessageIds(
    conversationId: number, 
    userId: number,
    isSender: boolean,
  ): Promise<number[]> {
    const where: FindOptionsWhere<Message> = {
      conversation: { id: conversationId },
      isRead: false,
    };
    if (isSender) {
      where.sender = { id: userId };
    } else {
      where.sender = Not(userId);
    }
    
    const messages = await this.messageRepository.find({
      where,
      select: { id: true },
      order: { sentAt: 'ASC' }
    });
    
    return messages.map(msg => msg.id);
  }

  async getOtherParticipantId(conversationId: number, userId: number): Promise<number> {
    const conversation = await this.findConversationById(conversationId);
    if (userId == conversation.participant1.id) {
      return conversation.participant2.id;
    } 
    else if (userId == conversation.participant2.id) {
      return conversation.participant1.id;
    }
    throw new ConversationAccessDeniedException(conversation.id, userId);
  }

  // ==================== SHARED PRIVATE METHODS ====================

  /**
   * Проверка существования беседы между пользователями
   * @private
   */
  private async checkConversationExists(
    user1Id: number, 
    user2Id: number, 
    listingId?: number
  ): Promise<boolean> {
    const listingCondition = listingId ? { id: listingId } : IsNull() as FindOperator<any>;

    const conditions = [
      { 
        participant1: { id: user1Id }, 
        participant2: { id: user2Id },
        listing: listingCondition
      },
      { 
        participant1: { id: user2Id }, 
        participant2: { id: user1Id },
        listing: listingCondition
      }
    ];

    const count = await this.conversationRepository.count({
      where: conditions
    });

    return count > 0;
  }
}
