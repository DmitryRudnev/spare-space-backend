import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { FileMetaDto } from './dto/generate-presigned-urls.dto';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('S3_BUCKET_NAME');
    this.endpoint = this.configService.getOrThrow<string>('S3_ENDPOINT');
    
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('S3_REGION'),
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: true, // Обязательно для Yandex Cloud
    });
  }

  async generatePresignedUrls(files: FileMetaDto[], userId: number) {
    return Promise.all(
      files.map(async (file) => {
        // Структура папок: listings/userId/uuid.extension
        const key = `listings/${userId}/${randomUUID()}.${file.extension}`;

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: file.contentType,
        });

        // Ссылка живёт 15 минут
        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
        
        // Публичный URL для чтения (Yandex Cloud формат)
        const publicUrl = `${this.endpoint}/${this.bucketName}/${key}`;

        return { uploadUrl, publicUrl };
      })
    );
  }
}
