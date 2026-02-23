/**
 * @fileoverview Типы для сущности настроек пользователя.
 *
 * Определяет модель данных пользовательских настроек (API ключи).
 */

/**
 * Модель настроек пользователя.
 *
 * Содержит API ключи для внешних сервисов.
 */
export interface UserSettings {
  /**
   * Уникальный идентификатор.
   */
  id: number;

  /**
   * ID пользователя.
   */
  userId: number;

  /**
   * API ключ CoinMarketCap.
   */
  coinmarketcapApiKey?: string;

  /**
   * API ключ OpenSea.
   */
  openseaApiKey?: string;

  /**
   * Дата создания.
   */
  createdAt: string;

  /**
   * Дата обновления.
   */
  updatedAt: string;
}

/**
 * DTO для создания настроек.
 */
export interface CreateUserSettingsDto {
  coinmarketcapApiKey?: string;
  openseaApiKey?: string;
}

/**
 * DTO для обновления настроек.
 */
export interface UpdateUserSettingsDto {
  coinmarketcapApiKey?: string;
  openseaApiKey?: string;
}
