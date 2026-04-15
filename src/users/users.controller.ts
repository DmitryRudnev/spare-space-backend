import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  HttpStatus,
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
  ApiConflictResponse,
} from '@nestjs/swagger';

import { UsersService } from './services/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { UserMapper } from './mappers/user.mapper';

import { UpdateUserDto } from './dto/requests/update-user.dto';
import { UserPublicResponseDto } from './dto/responses/user-public-response.dto';
import { UserPrivateResponseDto } from './dto/responses/user-private-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile/me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение собственного профиля' })
  @ApiOkResponse({ type: UserPrivateResponseDto, description: 'Полный профиль пользователя' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  async getMyProfile(@User('userId') currentUserId: number): Promise<UserPrivateResponseDto> {
    const user = await this.usersService.findById(currentUserId);
    return UserMapper.toPrivateResponseDto(user);
  }

  @Get('profile/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение публичного профиля пользователя' })
  @ApiParam({ type: Number, name: 'id', description: 'ID пользователя' })
  @ApiOkResponse({ type: UserPublicResponseDto, description: 'Публичный профиль пользователя' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  async findOne(@Param('id') id: string): Promise<UserPublicResponseDto> {
    const user = await this.usersService.findById(+id);
    return UserMapper.toPublicResponseDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление профиля пользователя' })
  @ApiOkResponse({ type: UserPrivateResponseDto, description: 'Профиль успешно обновлен' })
  @ApiUnauthorizedResponse({ description: 'Не авторизован или доступ запрещен' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @ApiBadRequestResponse({ description: 'Некорректные данные запроса' })
  @ApiConflictResponse({ description: 'Email или телефон уже используется' })
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @User('userId') currentUserId: number
  ): Promise<UserPrivateResponseDto> {
    const user = await this.usersService.update(currentUserId, updateUserDto);
    return UserMapper.toPrivateResponseDto(user);
  }
}
