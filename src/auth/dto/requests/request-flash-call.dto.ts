import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber } from 'class-validator';

export class RequestFlashCallDto {
  @ApiProperty({
    type: String,
    description: 'Номер телефона',
    example: '+78005553535',
  })
  @IsString()
  @IsPhoneNumber()
  phone: string;
}
