/**
 * @fileoverview DTO для обновления настроек пользователя.
 *
 * Наследует от CreateUserSettingsDto, делая все поля опциональными.
 */

import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO для обновления настроек пользователя.
 * Все поля опциональны для partial updates.
 */
export class UpdateUserSettingsDto {
  /**
   * API-ключ CoinMarketCap (опционально).
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
   * API-ключ OpenSea (опционально).
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
