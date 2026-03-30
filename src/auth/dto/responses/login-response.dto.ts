import { ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Access токен (если 2ФА отключена)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Refresh токен (если 2ФА отключена)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Требуется ли двухфакторная аутентификация',
    example: true
  })
  requiresTwoFactor?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Временный токен для подтверждения 2FA',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  twoFactorToken?: string;
}
