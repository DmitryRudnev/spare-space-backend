import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateBanStatusDto {
  @ApiProperty({ description: 'Статус блокировки', example: true })
  @IsBoolean()
  isBanned: boolean;
}

export class UpdateVerifiedStatusDto {
  @ApiProperty({ description: 'Статус верификации', example: true })
  @IsBoolean()
  verified: boolean;
}
