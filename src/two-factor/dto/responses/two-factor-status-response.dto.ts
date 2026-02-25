import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorStatusResponseDto {
  @ApiProperty({
    description: 'Включена ли двухфакторная аутентификация для пользователя',
    example: true,
  })
  enabled: boolean;
}
