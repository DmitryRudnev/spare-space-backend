import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Validate, IsOptional, IsPhoneNumber, IsEmail, IsString, Length } from 'class-validator';
import { EmailOrPhoneValidator } from '../../validators/email-or-phone.validator';

export class LoginDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Телефон',
    example: '+78005553535'
  })
  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    type: String, 
    description: 'Email',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({
    type: String,
    description: 'Пароль',
    minLength: 8,
    maxLength: 100,
    example: 'qwerty123'
  })
  @IsString()
  @Length(8, 100)
  password: string;

  @Validate(EmailOrPhoneValidator)
  readonly emailOrPhone?: string;
}
