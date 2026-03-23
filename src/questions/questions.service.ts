import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Question } from '../entities/question.entity';
import { CreateQuestionDto } from './dto/requests/create-question.dto';
import { AnswerQuestionDto } from './dto/requests/answer-question.dto';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly listingsService: ListingsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Получение вопроса по ID с проверкой существования
   * @param questionId - ID вопроса
   * @returns Найденный вопрос
   * @throws NotFoundException если вопрос не найден
   */
  async findById(questionId: number): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['fromUser', 'toUser'],
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  /**
   * Получение вопросов по объявлению с пагинацией
   * @param listingId - ID объявления
   * @param limit - Лимит записей (по умолчанию 20)
   * @param offset - Смещение (по умолчанию 0)
   * @returns Пагинированный список вопросов с метаданными
   */
  async findByListing(
    listingId: number,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ questions: Question[]; total: number; limit: number; offset: number }> {
    // Проверяем существование активного объявления через сервис
    try {
      await this.listingsService.validateExistence(listingId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Listing not found or not active');
      }
      throw error;
    }

    // Строим запрос с пагинацией
    const query = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.fromUser', 'fromUser')
      .leftJoinAndSelect('question.toUser', 'toUser')
      .where('question.listing_id = :listingId', { listingId })
      .orderBy('question.created_at', 'DESC');

    // Получаем данные с пагинацией
    const [questions, total] = await query
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    return { questions, total, limit, offset };
  }

  /**
   * Создание нового вопроса
   * @param createQuestionDto - DTO для создания вопроса
   * @param fromUserId - ID пользователя, задающего вопрос
   * @returns Созданный вопрос
   */
  async create(
    createQuestionDto: CreateQuestionDto,
    fromUserId: number,
  ): Promise<Question> {
    // Проверяем существование активного объявления через сервис
    let listing;
    try {
      listing = await this.listingsService.findByIdWithCache(createQuestionDto.listingId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Listing not found or not active');
      }
      throw error;
    }

    // Проверяем существование пользователя, задающего вопрос
    const fromUser = await this.usersService.findById(fromUserId);
    const toUser = listing.user;

    // Нельзя задавать вопрос самому себе
    if (fromUserId === toUser.id) {
      throw new BadRequestException('Cannot ask question to yourself');
    }

    // Создаем вопрос
    const question = this.questionRepository.create({
      listing: { id: listing.id },
      fromUser: { id: fromUserId },
      toUser: { id: toUser.id },
      text: createQuestionDto.text,
    });

    await this.questionRepository.save(question);
    return this.findById(question.id);
  }

  /**
   * Ответ на вопрос
   * @param questionId - ID вопроса
   * @param answerQuestionDto - DTO с ответом
   * @param currentUserId - ID текущего пользователя
   * @returns Обновленный вопрос
   */
  async answer(
    questionId: number,
    answerQuestionDto: AnswerQuestionDto,
    currentUserId: number,
  ): Promise<Question> {
    // Находим вопрос с отношениями
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['toUser'],
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Проверяем права: отвечать может только адресат (toUser)
    if (Number(question.toUser.id) !== currentUserId) {
      throw new ForbiddenException('Only the question recipient can answer');
    }

    // Обновляем ответ и дату ответа
    question.answer = answerQuestionDto.answer || null;
    question.answeredAt = answerQuestionDto.answer ? new Date() : null;

    await this.questionRepository.save(question);
    return this.findById(question.id);
  }
}
