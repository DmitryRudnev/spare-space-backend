import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { types } from 'pg';

async function bootstrap() {
  types.setTypeParser(20, (val) => parseInt(val, 10));  // bigint (int8) -> number
  types.setTypeParser(1700, (val) => parseFloat(val));  // numeric/decimal -> number

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  const config = new DocumentBuilder()
    .setTitle('NestJS Backend API')
    .setDescription('API на базе NestJS для управления данными, аутентификацией и реал-тайм событиями')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    // origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  await app.listen(configService.getOrThrow('PORT'), '0.0.0.0');
}

bootstrap();
