import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, Matches, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class FileMetaDto {
  @ApiProperty({ description: 'MIME-тип файла', example: 'image/jpeg' })
  @IsString()
  @Matches(/^image\/(jpeg|png|webp|heic)$/, { message: 'Поддерживаются только изображения (jpeg, png, webp, heic)' })
  contentType: string;

  @ApiProperty({ description: 'Расширение файла', example: 'jpg' })
  @IsString()
  extension: string;
}

export class GeneratePresignedUrlsDto {
  @ApiProperty({ type: [FileMetaDto], description: 'Метаданные файлов для загрузки' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => FileMetaDto)
  files: FileMetaDto[];
}
