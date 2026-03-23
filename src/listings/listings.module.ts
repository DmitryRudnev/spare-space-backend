import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ListingsService } from './listings.service';
import { ListingsControllerHandler } from './listings.controller-handler';
import { ListingsController } from './listings.controller';
import { Listing } from '../entities/listing.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing, ViewHistory]),
    PassportModule,
    UsersModule,
    RedisModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService, ListingsControllerHandler],
  exports: [ListingsService],
})
export class ListingsModule {}
