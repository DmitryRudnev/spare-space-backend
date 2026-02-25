import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class EnableTwoFactorRequestDto {
  @ApiProperty({
    description: '6-значный TOTP код из приложения-аутентификатора',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
