import { ApiProperty } from '@nestjs/swagger';

export class GenerateSecretResponseDto {
  @ApiProperty({
    description: 'Временный TOTP секрет в формате base32',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'otpauth URL для генерации QR-кода',
    example: 'otpauth://totp/YourApp:user@example.com?secret=...&issuer=YourApp',
  })
  otpauthUrl: string;
}
