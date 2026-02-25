import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { Listing } from '../entities/listing.entity';
import { ViewHistory } from '../entities/view-history.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing, ViewHistory]),
    PassportModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
