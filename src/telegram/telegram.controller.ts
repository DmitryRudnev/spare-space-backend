import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Logger, 
  Get, 
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiOkResponse, 
  ApiConflictResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { TelegramWebhookGuard } from './guards/telegram-webhook.guard';
import { TelegramService } from './services/telegram.service';
import { TelegramAccountService } from './services/telegram-account.service';
import type { TelegramWebhookUpdate } from './interfaces';
import { GenerateTelegramLinkResponseDto } from './dto/generate-telegram-link-response.dto';
import { UnlinkTelegramAccountRequestDto } from './dto/unlink-telegram-account-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramAccountService: TelegramAccountService,
  ) {}

  @Post('webhook')
  @UseGuards(TelegramWebhookGuard)
  async handleWebhook(@Body() update: TelegramWebhookUpdate): Promise<{ status: string }> {
    this.telegramService.handleUpdate(update);
    return { status: 'ok' };
  }

  @Get('link')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить ссылку для привязки Telegram аккаунта' })
  @ApiOkResponse({ type: GenerateTelegramLinkResponseDto, description: 'Ссылка успешно сгенерирована' })
  async generateTelegramLink(
    @User('userId') currentUserId: number
  ): Promise<GenerateTelegramLinkResponseDto> {
    const link = await this.telegramAccountService.generateTelegramLink(currentUserId);
    return { link };
  }

  @Delete('unlink')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отвязать текущий Telegram аккаунт' })
  @ApiNoContentResponse({ description: 'Telegram аккаунт успешно отвязан' })
  @ApiConflictResponse({ description: 'Указанный Telegram аккаунт не привязан к пользователю' })
  async unlinkTelegramAccount(
    @User('userId') currentUserId: number,
    // @Body() unlinkDto: UnlinkTelegramAccountRequestDto,
  ): Promise<void> {
    await this.telegramAccountService.unlinkTelegramAccount(currentUserId);
    // await this.telegramAccountService.unlinkTelegramAccount(currentUserId, unlinkDto.telegramId);
  }
}
