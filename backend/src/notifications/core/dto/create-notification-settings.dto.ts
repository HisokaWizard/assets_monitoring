/**
 * @fileoverview DTO для создания настроек уведомлений.
 *
 * Этот файл определяет структуру данных для создания настроек уведомлений.
 * Включает валидацию полей.
 */

import { IsString, IsBoolean, IsNumber, Min, Max, IsIn, IsOptional } from 'class-validator';

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
  @IsIn(['crypto', 'nft'])
  assetType: string;

  /**
   * Включены ли уведомления.
   */
  @IsBoolean()
  enabled: boolean;

  /**
   * Порог изменения цены в процентах.
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  thresholdPercent: number;

  /**
   * Интервал проверки в часах (2,4,6,8,10,12).
   */
  @IsNumber()
  @IsIn([2, 4, 6, 8, 10, 12])
  intervalHours: number;

  /**
   * Интервал обновления в часах.
   */
  @IsOptional()
  @IsNumber()
  updateIntervalHours?: number = 4;
}
