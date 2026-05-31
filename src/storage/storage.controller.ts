import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { GeneratePresignedUrlsDto } from './dto/generate-presigned-urls.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-urls')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить ссылки для прямой загрузки файлов в S3' })
  @ApiOkResponse({ description: 'Возвращает массив URL для загрузки (PUT) и публичных URL' })
  async getPresignedUrls(
    @Body() dto: GeneratePresignedUrlsDto,
    @User('userId') userId: number,
  ) {
    const urls = await this.storageService.generatePresignedUrls(dto.files, userId);
    return { urls };
  }
}
