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

/**
 * DTO для создания настроек уведомлений.
 *
 * Определяет поля для создания новых настроек уведомлений пользователя.
 */
export class CreateNotificationSettingsDto {
  /**
   * Тип актива (crypto, nft).
   */
  @IsString()
  @IsIn(["crypto", "nft"])
  assetType!: string;

  /**
   * Включены ли уведомления.
   */
  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;

  /**
   * Порог изменения цены в процентах.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  thresholdPercent?: number = 10;

  /**
   * Интервал проверки в часах (2,4,6,8,10,12).
   */
  @IsOptional()
  @IsNumber()
  @IsIn([2, 4, 6, 8, 10, 12])
  intervalHours?: number = 4;

  /**
   * Интервал обновления в часах.
   */
  @IsOptional()
  @IsNumber()
  updateIntervalHours?: number = 4;
}
