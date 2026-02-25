import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty({
    description: 'Временный токен, полученный при логине',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  twoFactorToken: string;

  @ApiProperty({
    description: '6-значный код из приложения аутентификатора',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 10)
  code: string;
}
