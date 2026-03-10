/**
 * @fileoverview DTO для создания настроек пользователя.
 *
 * Определяет структуру данных для создания настроек API.
 */

import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO для создания настроек пользователя.
 */
export class CreateUserSettingsDto {
  /**
   * API-ключ CoinMarketCap.
   * Должен быть не менее 20 символов (обычно 32).
   */
  @ApiPropertyOptional({
    description: "API-ключ CoinMarketCap",
    example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    minLength: 20,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  coinmarketcapApiKey?: string;

  /**
   * API-ключ OpenSea.
   * Должен быть не менее 20 символов.
   */
  @ApiPropertyOptional({
    description: "API-ключ OpenSea",
    example: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    minLength: 20,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  openseaApiKey?: string;
}
