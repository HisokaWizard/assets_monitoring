/**
 * @fileoverview DTO для создания настроек пользователя.
 *
 * Определяет структуру данных для создания настроек API.
 */

import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * DTO для создания настроек пользователя.
 */
export class CreateUserSettingsDto {
  /**
   * API-ключ CoinMarketCap.
   * Должен быть не менее 20 символов (обычно 32).
   */
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  coinmarketcapApiKey?: string;

  /**
   * API-ключ OpenSea.
   * Должен быть не менее 20 символов.
   */
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  openseaApiKey?: string;
}
