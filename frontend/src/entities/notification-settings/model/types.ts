/**
 * @fileoverview Типы для сущности настроек уведомлений.
 *
 * Определяет модель данных настроек мониторинга.
 */

/**
 * Тип актива.
 */
export type AssetType = 'crypto' | 'nft';

/**
 * Модель настроек уведомлений.
 *
 * Настройки мониторинга для определенного типа актива.
 */
export interface NotificationSettings {
  /**
   * Уникальный идентификатор.
   */
  id: number;

  /**
   * ID пользователя.
   */
  userId: number;

  /**
   * Тип актива (crypto или nft).
   */
  assetType: AssetType;

  /**
   * Включены ли уведомления.
   */
  enabled: boolean;

  /**
   * Порог изменения цены в процентах.
   */
  thresholdPercent: number;

  /**
   * Интервал проверки в часах.
   */
  intervalHours: number;

  /**
   * Интервал обновления в часах.
   */
  updateIntervalHours: number;

  /**
   * Время последнего уведомления.
   */
  lastNotified?: string;
}

/**
 * DTO для создания настроек.
 */
export interface CreateNotificationSettingsDto {
  assetType: AssetType;
  enabled?: boolean;
  thresholdPercent?: number;
  intervalHours?: number;
  updateIntervalHours?: number;
}

/**
 * DTO для обновления настроек.
 */
export interface UpdateNotificationSettingsDto {
  enabled?: boolean;
  thresholdPercent?: number;
  intervalHours?: number;
  updateIntervalHours?: number;
}

/**
 * Найти настройки по типу актива.
 *
 * @param settings - массив настроек
 * @param assetType - тип актива
 * @returns настройки для указанного типа или undefined
 */
export const selectSettingsByAssetType = (
  settings: NotificationSettings[] | undefined,
  assetType: AssetType,
): NotificationSettings | undefined => {
  if (!settings) return undefined;
  return settings.find((s) => s.assetType === assetType);
};
