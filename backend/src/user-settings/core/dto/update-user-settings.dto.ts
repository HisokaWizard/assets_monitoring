/**
 * @fileoverview DTO для обновления настроек пользователя.
 *
 * Наследует от CreateUserSettingsDto, делая все поля опциональными.
 */

import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * DTO для обновления настроек пользователя.
 * Все поля опциональны для partial updates.
 */
export class UpdateUserSettingsDto {
  /**
   * API-ключ CoinMarketCap (опционально).
   */
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  coinmarketcapApiKey?: string;

  /**
   * API-ключ OpenSea (опционально).
   */
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  openseaApiKey?: string;
}
