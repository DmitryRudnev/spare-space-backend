import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { ListingsService } from './listings.service';
import { FavoritesService } from './favorites.service';
import { ListingsController } from './listings.controller';
import { FavoritesController } from './favorites.controller';
import { ListingsControllerHandler } from './listings.controller-handler';
import { Listing } from '../entities/listing.entity';
import { Favorite } from '../entities/favorite.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing, Favorite, ViewHistory]),
    PassportModule,
    UsersModule,
    RedisModule,
  ],
  controllers: [ListingsController, FavoritesController],
  providers: [ListingsService, FavoritesService, ListingsControllerHandler],
  exports: [ListingsService, FavoritesService],
})
export class ListingsModule {}
