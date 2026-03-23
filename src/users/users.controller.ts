import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
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

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Получение публичного профиля пользователя',
    description: 'Возвращает публичные данные пользователя по ID. Аутентификация не требуется.'
  })
  @ApiParam({ name: 'id', description: 'ID пользователя', type: Number })
  @ApiOkResponse({
    description: 'Публичный профиль пользователя',
    type: UserPublicResponseDto
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  async findOne(@Param('id') id: string): Promise<UserPublicResponseDto> {
    const user = await this.usersService.findById(+id);
    return UserMapper.toPublicResponseDto(user);
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile/me')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получение собственного профиля',
    description: 'Возвращает полные данные профиля текущего пользователя. Требует аутентификации.'
  })
  @ApiOkResponse({
    description: 'Приватный профиль пользователя',
    type: UserPrivateResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Не авторизован' })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  async getMyProfile(@User('userId') currentUserId: number): Promise<UserPrivateResponseDto> {
    const user = await this.usersService.findById(currentUserId);
    return UserMapper.toPrivateResponseDto(user);
  }


  @UseGuards(JwtAuthGuard)
  @Patch('profile/me')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновление профиля пользователя',
    description: 'Обновляет данные профиля. Требует аутентификации и владения профилем.'
  })
  @ApiParam({ name: 'id', description: 'ID пользователя для обновления', type: Number })
  @ApiBody({ type: UpdateUserDto, description: 'Данные для обновления' })
  @ApiOkResponse({
    description: 'Профиль успешно обновлен',
    type: UserPrivateResponseDto
  })
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
