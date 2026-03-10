/**
 * @fileoverview DTO для создания настроек уведомлений.
 *
 * Этот файл определяет структуру данных для создания настроек уведомлений.
 * Включает валидацию полей.
 */

import {
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO для создания настроек уведомлений.
 *
 * Определяет поля для создания новых настроек уведомлений пользователя.
 */
export class CreateNotificationSettingsDto {
  /**
   * Тип актива (crypto, nft).
   */
  @ApiProperty({
    description: "Тип актива",
    enum: ["crypto", "nft"],
    example: "crypto",
  })
  @IsString()
  @IsIn(["crypto", "nft"])
  assetType!: string;

  /**
   * Включены ли уведомления.
   */
  @ApiPropertyOptional({
    description: "Включены ли уведомления",
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;

  /**
   * Порог изменения цены в процентах.
   */
  @ApiPropertyOptional({
    description: "Порог изменения цены (%)",
    minimum: 0,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  thresholdPercent?: number = 10;

  /**
   * Интервал проверки в часах (2,4,6,8,10,12).
   */
  @ApiPropertyOptional({
    description: "Интервал проверки (часы)",
    enum: [2, 4, 6, 8, 10, 12],
    default: 4,
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @IsIn([2, 4, 6, 8, 10, 12])
  intervalHours?: number = 4;

  /**
   * Интервал обновления в часах.
   */
  @ApiPropertyOptional({
    description: "Интервал обновления активов (часы)",
    default: 4,
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  updateIntervalHours?: number = 4;
}
