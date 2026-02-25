import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DisableTwoFactorRequestDto {
  @ApiProperty({
    description: 'Текущий TOTP код или код восстановления',
    example: '123456',
  })
  @IsString()
  @Length(6, 10)
  code: string;
}
