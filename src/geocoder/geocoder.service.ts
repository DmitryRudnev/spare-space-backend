import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeocoderService {
  private readonly logger = new Logger(GeocoderService.name);
  private readonly apiKey: string;
  private readonly suggestUrl = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';
  private readonly geolocateUrl = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.getOrThrow('DADATA_API_KEY');
  }

  private get headers() {
    return {
      Authorization: `Token ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async suggestAddress(query: string): Promise<Array<{ address: string; latitude: number | null; longitude: number | null }>> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(this.suggestUrl, { query }, { headers: this.headers }),
      );

      return data.suggestions.map((s: any) => ({
        address: s.value,
        latitude: s.data.geo_lat ? parseFloat(s.data.geo_lat) : null,
        longitude: s.data.geo_lon ? parseFloat(s.data.geo_lon) : null,
      }));
    } catch (error) {
      this.logger.error(`Ошибка DaData подсказок для "${query}": ${error.message}`);
      return [];
    }
  }

  async getAddressByCoords(latitude: number, longitude: number): Promise<string | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          this.geolocateUrl,
          { lat: latitude, lon: longitude, radius_meters: 100 },
          { headers: this.headers },
        ),
      );

      if (data.suggestions && data.suggestions.length > 0) {
        return data.suggestions[0].value;
      }
      return null;
    } catch (error) {
      this.logger.error(`Ошибка DaData обратного геокодирования для [${latitude}, ${longitude}]: ${error.message}`);
      return null;
    }
  }
}
