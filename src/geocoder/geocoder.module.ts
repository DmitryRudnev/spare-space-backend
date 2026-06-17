import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeocoderService } from './geocoder.service';
import { GeocoderController } from './geocoder.controller';

@Module({
  imports: [HttpModule],
  controllers: [GeocoderController],
  providers: [GeocoderService],
  exports: [GeocoderService],
})
export class GeocoderModule {}
