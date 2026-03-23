import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_IOREDIS = 'REDIS_IOREDIS';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) => {
        const host = config.getOrThrow<string>('REDIS_HOST');
        const port = config.getOrThrow<number>('REDIS_PORT');
        const ttl = config.getOrThrow<number>('REDIS_TTL') * 1000;
        return new Keyv({ store: new KeyvRedis(`redis://${host}:${port}`), ttl });
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_IOREDIS,
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT, REDIS_IOREDIS],
})
export class RedisClientModule {}