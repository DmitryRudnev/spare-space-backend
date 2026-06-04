import { ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyFlashCallResponseDto {
  // Если пользователь ещё НЕ зарегистрирован
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Требуется ли завершение регистрации',
    example: false
  })
  requiresRegistration?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Временный токен для завершения регистрации (если пользователь не зарегистрирован)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  registerToken?: string;


  // Если пользователь зарегистрирован и 2ФА НЕ включена
  @ApiPropertyOptional({
    type: String,
    description: 'Access токен (если пользователь зарегистрирован)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Refresh токен (если пользователь зарегистрирован)',
    example: '70IIzhrgTuqPsI47fZgUf_P2lwGL9YFAUU5w...',
  })
  refreshToken?: string;


  // Если пользователь зарегистрирован и 2ФА включена
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Требуется ли двухфакторная аутентификация',
    example: true
  })
  requiresTwoFactor?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Временный токен для подтверждения 2FA (если пользователь зарегистрирован и 2ФА включена)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  twoFactorToken?: string;
}
