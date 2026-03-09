/**
 * @fileoverview Интерфейсы для типизации ответов внешних API.
 *
 * Содержит интерфейсы для CoinMarketCap и OpenSea API ответов.
 * Используются для устранения `as any` при работе с внешними API.
 */

/**
 * Данные о криптовалюте в USD от CoinMarketCap.
 */
interface CoinMarketCapQuoteUSD {
  price: number;
  percent_change_24h?: number;
  percent_change_7d?: number;
  percent_change_30d?: number;
  volume_24h?: number;
  market_cap?: number;
}

/**
 * Данные о криптовалюте по символу от CoinMarketCap.
 */
interface CoinMarketCapSymbolData {
  id: number;
  symbol: string;
  name: string;
  quote: {
    USD: CoinMarketCapQuoteUSD;
  };
}

/**
 * Индексный тип для данных криптовалют по символу.
 */
interface CoinMarketCapData {
  [symbol: string]: CoinMarketCapSymbolData;
}

/**
 * Ответ от CoinMarketCap API v1/cryptocurrency/quotes/latest.
 */
export interface CoinMarketCapResponse {
  data: CoinMarketCapData;
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

/**
 * Данные о floor price от OpenSea API v2.
 */
interface OpenSeaTotalStats {
  floor_price: number | null;
  floor_price_symbol: string | null;
  total_supply?: number;
  num_owners?: number;
  market_cap?: number;
  volume_all?: number;
}

/**
 * Ответ от OpenSea API v2 /collections/{slug}/stats.
 */
export interface OpenSeaResponse {
  total: OpenSeaTotalStats;
}

/**
 * Результат получения данных из OpenSea.
 */
export interface OpenSeaFetchResult {
  floorPrice: number | null;
  floorPriceUsd: number | null;
  floorPriceSymbol: string | null;
}
