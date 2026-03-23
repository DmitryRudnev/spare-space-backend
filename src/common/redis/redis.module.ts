import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisClientModule } from './redis-client.module';

@Module({
  imports: [RedisClientModule],
  providers: [RedisService],
  exports: [RedisClientModule, RedisService],
})
export class RedisModule {}
