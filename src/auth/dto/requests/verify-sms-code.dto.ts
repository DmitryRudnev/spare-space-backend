import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber, Length } from 'class-validator';

export class VerifySmsCodeDto {
  @ApiProperty({
    type: String,
    description: 'Номер телефона',
    example: '+78005553535',
  })
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Последние 4 цифры позвонившего телефона',
    example: '0000',
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @Length(4, 4)
  code: string;
}
