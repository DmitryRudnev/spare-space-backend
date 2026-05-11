import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  ParseIntPipe,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { QuestionsService } from './questions.service';
import { QuestionMapper } from './mappers/question.mapper';
import { CreateQuestionDto } from './dto/requests/create-question.dto';
import { AnswerQuestionDto } from './dto/requests/answer-question.dto';
import { QuestionListResponseDto } from './dto/responses/question-list-response.dto';
import { QuestionDetailResponseDto } from './dto/responses/question-detail-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Questions')
@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('listings/:id/questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение списка вопросов к объявлению' })
  @ApiParam({ type: Number, name: 'id', description: 'ID объявления' })
  @ApiOkResponse({ type: QuestionListResponseDto, description: 'Список вопросов к объявлению' })
  @ApiNotFoundResponse({ description: 'Объявление не найдено' })
  async getListingQuestions(
    @Param('id', ParseIntPipe) listingId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<QuestionListResponseDto> {
    const result = await this.questionsService.findByListing(
      listingId,
      paginationDto.limit,
      paginationDto.offset,
    );
    return QuestionMapper.toListResponseDto(
      result.questions,
      result.total,
      result.limit,
      result.offset,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание вопроса к объявлению' })
  @ApiCreatedResponse({ type: QuestionDetailResponseDto, description: 'Вопрос успешно создан' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Объявление или пользователь не найдены' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
    @User('userId') fromUserId: number,
  ): Promise<QuestionDetailResponseDto> {
    const question = await this.questionsService.create(createQuestionDto, fromUserId);
    return QuestionMapper.toDetailResponseDto(question);
  }
  
  @UseGuards(JwtAuthGuard)
  @Patch('questions/:id/answer')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Добавление ответа на вопрос'
  })
  @ApiParam({ type: Number, name: 'id', description: 'ID вопроса' })
  @ApiOkResponse({ type: QuestionDetailResponseDto, description: 'Ответ успешно добавлен' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав для ответа' })
  @ApiNotFoundResponse({ description: 'Вопрос не найден' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  async answer(
    @Param('id', ParseIntPipe) questionId: number,
    @Body() answerQuestionDto: AnswerQuestionDto,
    @User('userId') currentUserId: number,
  ): Promise<QuestionDetailResponseDto> {
    const question = await this.questionsService.answer(
      questionId,
      answerQuestionDto,
      currentUserId,
    );
    return QuestionMapper.toDetailResponseDto(question);
  }
}
