/**
 * @fileoverview Типы для сущности активов.
 *
 * Определяет модели данных для криптовалютных и NFT активов.
 */

/**
 * Базовые поля актива.
 */
export interface Asset {
  id: number;
  type: 'crypto' | 'nft';
  amount: number;
  middlePrice: number;
  previousPrice: number;
  multiple: number;
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
  quartChange: number;
  yearChange: number;
  totalChange: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Криптовалютный актив.
 */
export interface CryptoAsset extends Asset {
  type: 'crypto';
  symbol: string;
  fullName: string;
  currentPrice: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  quartPrice: number;
  yearPrice: number;
  dailyTimestamp: string;
  weeklyTimestamp: string;
  monthlyTimestamp: string;
  quartTimestamp: string;
  yearTimestamp: string;
}

/**
 * NFT актив.
 *
 * middlePrice (из базового Asset) хранится в нативном токене (ETH, SOL и т.д.).
 * floorPrice — floor price в нативном токене (из OpenSea).
 * floorPriceUsd — floor price в USD (из OpenSea floor_price_usd).
 * middlePriceUsd — средняя цена покупки в USD (middlePrice * курс токена).
 */
export interface NFTAsset extends Asset {
  type: 'nft';
  collectionName: string;
  /** Символ нативного токена коллекции (ETH, SOL, WETH, ATOM и т.д.) */
  nativeToken: string;
  /** Floor price в нативном токене (из OpenSea) */
  floorPrice: number;
  /** Floor price в USD (из OpenSea floor_price_usd) */
  floorPriceUsd: number;
  /** Средняя цена покупки в USD (middlePrice * курс nativeToken) */
  middlePriceUsd: number;
  traitPrice: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  quartPrice: number;
  yearPrice: number;
  dailyTimestamp: string;
  weeklyTimestamp: string;
  monthlyTimestamp: string;
  quartTimestamp: string;
  yearTimestamp: string;
}

/**
 * DTO для создания криптоактива.
 */
export interface CreateCryptoAssetDto {
  type: 'crypto';
  symbol: string;
  fullName: string;
  amount: number;
  middlePrice: number;
  currentPrice?: number;
}

/**
 * DTO для создания NFT актива.
 */
export interface CreateNFTAssetDto {
  type: 'nft';
  collectionName: string;
  /** Символ нативного токена коллекции (по умолчанию ETH) */
  nativeToken?: string;
  amount: number;
  /** Средняя цена покупки в нативном токене */
  middlePrice: number;
  floorPrice?: number;
  traitPrice?: number;
}

/**
 * DTO для создания актива.
 */
export type CreateAssetDto = CreateCryptoAssetDto | CreateNFTAssetDto;

/**
 * DTO для обновления актива.
 */
export interface UpdateAssetDto {
  amount?: number;
  middlePrice?: number;
  currentPrice?: number;
}

/**
 * Вычисляемые поля для актива.
 */
export interface AssetCalculatedFields {
  totalValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercent: number;
}
