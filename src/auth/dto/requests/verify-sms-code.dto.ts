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
    description: 'Код из SMS',
    example: '000000',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
