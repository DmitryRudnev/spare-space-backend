import { ApiProperty } from '@nestjs/swagger';

export class EnableTwoFactorResponseDto {
  @ApiProperty({
    description: 'Список кодов восстановления (каждый по 10 шестнадцатеричных символов)',
    example: ['a1b2c3d4e5', 'f6g7h8i9j0'],
    type: [String],
  })
  recoveryCodes: string[];
}
