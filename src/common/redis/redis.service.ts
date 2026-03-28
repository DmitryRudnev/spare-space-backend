import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import Keyv from 'keyv';
import { Redis } from 'ioredis';
import { REDIS_CLIENT, REDIS_IOREDIS } from './redis-client.module';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly keyv: Keyv,
    @Inject(REDIS_IOREDIS) private readonly redis: Redis,
  ) {}

  /**
   * Получить данные из кэша, либо выполнить функцию, сохранить результат и вернуть его.
   */
  async getOrSet<T>(
    key: string,
    ttlSec: number,
    cb: () => Promise<T>,
    cls?: ClassConstructor<T>,
  ): Promise<T> {
    const cached = await this.keyv.get<T>(key);
    if (cached) {
      this.logger.log(`Cache hit for key: ${key}`);
      return cls ? plainToInstance(cls, cached) : (cached as T);
    }

    this.logger.log(`Cache miss for key: ${key}. Executing callback.`);
    const result = await cb();
    if (result !== undefined && result !== null) {
      this.logger.log(`Caching result for key: ${key} with TTL: ${ttlSec} seconds.`);
      // cache-manager v5+ требует миллисекунды
      await this.keyv.set(key, result, ttlSec * 1000);
    }
    return result;
  }

  /**
   * Прямое получение из кэша
   */
  async get<T>(key: string, cls?: ClassConstructor<T>): Promise<T | undefined> {
    const cached = await this.keyv.get<T>(key);
    if (cached) {
      this.logger.log(`Cache hit for key: ${key}`);
      return cls ? plainToInstance(cls, cached) : (cached as T);
    }
    this.logger.log(`Cache miss for key: ${key}`);
    return undefined;
  }

  /**
   * Прямая запись в кэш
   */
  async set(key: string, value: any, ttlSec: number): Promise<void> {
    await this.keyv.set(key, value, ttlSec * 1000);
  }

  /**
   * Удалить запись (инвалидация)
   */
  async delete(key: string): Promise<void> {
    await this.keyv.delete(key);
  }

  /**
   * Удалить все ключи, соответствующие паттерну (например, "reviews:listing:123:*").
   * Используется для инвалидации групп кеша.
   */
    async deleteByPattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({ 
      match: pattern,
      count: 100
    });

    for await (const keys of stream) {
      if (keys.length > 0) {
        await this.redis.unlink(...keys);
      }
    }
  }
}
