import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeocoderService {
  private readonly logger = new Logger(GeocoderService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://geocode-maps.yandex.ru/1.x/';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('YANDEX_MAP_GEOCODER_API_KEY');
  }

  async getCoordinates(address: string): Promise<{ longitude: number; latitude: number } | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            apikey: this.apiKey,
            geocode: address,
            format: 'json',
            results: 1,
          },
        }),
      );

      const featureMember = data?.response?.GeoObjectCollection?.featureMember;
      if (!featureMember || featureMember.length === 0) {
        return null; // Адрес не найден
      }

      // Яндекс возвращает координаты строкой: "Долгота Широта"
      const pos = featureMember[0].GeoObject.Point.pos;
      const [longitude, latitude] = pos.split(' ').map(Number);

      return { longitude, latitude };
    } catch (error) {
      this.logger.error(`Ошибка геокодирования для адреса "${address}": ${error.message}`);
      return null;
    }
  }

  async getAddress(longitude: number, latitude: number): Promise<string | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            apikey: this.apiKey,
            // Яндекс принимает координаты в формате "долгота,широта"
            geocode: `${longitude},${latitude}`,
            format: 'json',
            results: 1,
          },
        }),
      );

      const featureMember = data?.response?.GeoObjectCollection?.featureMember;
      if (!featureMember || featureMember.length === 0) {
        return null;
      }

      // Извлекаем полный отформатированный адрес
      return featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text;
    } catch (error) {
      this.logger.error(`Ошибка обратного геокодирования для [${longitude}, ${latitude}]: ${error.message}`);
      return null;
    }
  }
}
