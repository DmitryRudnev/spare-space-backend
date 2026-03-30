import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, IsOptional, IsNotEmpty } from 'class-validator';

export class CompleteRegistrationDto {
  @ApiProperty({
    type: String,
    description: 'Временный токен из verify-code',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  registerToken: string;

  @ApiProperty({ 
    type: String,
    description: 'Имя',
    example: 'Иван',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  firstName: string;

  @ApiProperty({
    type: String,
    description: 'Фамилия', 
    minLength: 1,
    maxLength: 50,
    example: 'Иванов'
  })
  @IsString()
  @Length(1, 50)
  lastName: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Отчество',
    minLength: 1,
    maxLength: 50,
    example: 'Иванович'
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  patronymic?: string;

  @ApiProperty({
    type: String,
    description: 'Пароль',
    example: 'some_strong`P@ssw0rd',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @Length(8, 100)
  password: string;
}
