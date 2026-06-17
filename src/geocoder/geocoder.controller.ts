import { Controller, Get, Query, ParseFloatPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { GeocoderService } from './geocoder.service';
import { AddressSuggestionDto } from './dto/address-suggestion.dto';
import { ReverseGeocodeResponseDto } from './dto/reverse-geocode-response.dto';

@ApiTags('Geocoder (DaData)')
@Controller('geocoder')
export class GeocoderController {
  constructor(private readonly geocoderService: GeocoderService) {}

  @Get('suggest')
  @ApiOperation({ summary: 'Получить подсказки адресов по текстовому запросу' })
  @ApiQuery({ name: 'query', type: String, description: 'Часть адреса для поиска', example: 'Зеленоград, Солнечная аллея' })
  @ApiOkResponse({ type: [AddressSuggestionDto], description: 'Список подходящих адресов с координатами' })
  async suggest(@Query('query') query: string): Promise<AddressSuggestionDto[]> {
    if (!query || query.length < 2) {
      return [];
    }
    return this.geocoderService.suggestAddress(query);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Получить текстовый адрес по координатам (по клику на карте)' })
  @ApiQuery({ name: 'latitude', type: Number, example: '55.7558' })
  @ApiQuery({ name: 'longitude', type: Number, example: '37.6173' })
  @ApiOkResponse({ type: ReverseGeocodeResponseDto, description: 'Текстовый адрес по переданным координатам' })
  async reverse(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
  ): Promise<ReverseGeocodeResponseDto> {
    const address = await this.geocoderService.getAddressByCoords(latitude, longitude);
    return { address };
  }
}
