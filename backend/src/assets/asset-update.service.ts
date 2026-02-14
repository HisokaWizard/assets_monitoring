/**
 * @fileoverview Сервис для обновления активов.
 *
 * Этот файл содержит бизнес-логику для автоматического обновления активов
 * с использованием внешних API (CoinMarketCap для криптовалют, OpenSea для NFT).
 * Сервис использует HttpService для API вызовов и @nestjs/schedule для джоб.
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Asset, CryptoAsset, NFTAsset } from './asset.entity';
import { HistoricalPrice } from './historical-price.entity';
import { User } from '../auth/user.entity';
import { NotificationSettings } from '../notifications/core/entities/notification-settings.entity';

/**
 * Сервис для обновления активов.
 *
 * Предоставляет методы для получения данных из внешних API,
 * вычисления изменений и автоматического обновления активов по расписанию.
 */
@Injectable()
export class AssetUpdateService {
  private readonly logger = new Logger(AssetUpdateService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    @InjectRepository(HistoricalPrice)
    private readonly historicalPriceRepository: Repository<HistoricalPrice>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(NotificationSettings)
    private readonly notificationSettingsRepository: Repository<NotificationSettings>,
  ) {}

  /**
   * Обновить активы для пользователей по их настройкам.
   */
  async updateAssetsForUsers(): Promise<number[]> {
    const updatedAssetIds: number[] = [];
    const now = new Date();

    // Получить все настройки уведомлений с пользователями
    const settings = await this.notificationSettingsRepository.find({
      where: { enabled: true },
      relations: ['user'],
    });

    // Группировать по пользователям
    const userSettingsMap = new Map<number, NotificationSettings[]>();
    for (const setting of settings) {
      if (!userSettingsMap.has(setting.userId)) {
        userSettingsMap.set(setting.userId, []);
      }
      userSettingsMap.get(setting.userId)!.push(setting);
    }

    for (const [userId, userSettings] of userSettingsMap) {
      const user = userSettings[0].user; // Все настройки имеют одного пользователя

      // Определить интервал: максимальный из настроек или 4 часа по умолчанию
      const intervalHours =
        userSettings.length > 0 ? Math.max(...userSettings.map((s) => s.intervalHours)) : 4;

      // Проверить, прошло ли время с последнего обновления
      const shouldUpdate =
        !user.lastUpdated ||
        now.getTime() - user.lastUpdated.getTime() >= intervalHours * 60 * 60 * 1000;

      if (shouldUpdate) {
        // Получить активы пользователя
        const assets = await this.assetsRepository.find({ where: { userId } });

        for (const asset of assets) {
          try {
            if (asset instanceof CryptoAsset) {
              await this.updateCryptoAsset(asset);
            } else if (asset instanceof NFTAsset) {
              await this.updateNFTAsset(asset);
            }
            updatedAssetIds.push(asset.id);
          } catch (error) {
            this.logger.error(`Ошибка обновления актива ${asset.id}: ${error.message}`);
          }
        }

        // Обновить lastUpdated пользователя
        user.lastUpdated = now;
        await this.userRepository.save(user);
      }
    }

    return updatedAssetIds;
  }

  /**
   * Обновить криптоактив.
   */
  private async updateCryptoAsset(asset: CryptoAsset): Promise<void> {
    const currentPrice = await this.fetchFromCoinMarketCap(asset.symbol);
    if (currentPrice) {
      asset.currentPrice = currentPrice;
      await this.calculateChanges(asset);
      await this.saveHistoricalPrice(asset.id, currentPrice, 'CoinMarketCap');
      await this.assetsRepository.save(asset);
    }
  }

  /**
   * Обновить NFT актив.
   */
  private async updateNFTAsset(asset: NFTAsset): Promise<void> {
    const floorPrice = await this.fetchFromOpenSea(asset.collectionName);
    if (floorPrice) {
      asset.floorPrice = floorPrice;
      await this.calculateChanges(asset);
      await this.saveHistoricalPrice(asset.id, floorPrice, 'OpenSea');
      await this.assetsRepository.save(asset);
    }
  }

  /**
   * Получить данные из CoinMarketCap API.
   */
  private async fetchFromCoinMarketCap(symbol: string): Promise<number | null> {
    try {
      const apiKey = process.env.COINMARKETCAP_API_KEY;
      if (!apiKey) {
        this.logger.warn('CoinMarketCap API key не установлен');
        return null;
      }

      const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { 'X-CMC_PRO_API_KEY': apiKey },
        }),
      );

      const data = (response.data as any).data[symbol.toUpperCase()];
      return data ? data.quote.USD.price : null;
    } catch (error) {
      this.logger.error(`Ошибка получения данных из CoinMarketCap для ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Получить данные из OpenSea API.
   */
  private async fetchFromOpenSea(collectionName: string): Promise<number | null> {
    try {
      const apiKey = process.env.OPENSEA_API_KEY;
      if (!apiKey) {
        this.logger.warn('OpenSea API key не установлен');
        return null;
      }

      const url = `https://api.opensea.io/api/v2/collections/${collectionName}/stats`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { 'X-API-KEY': apiKey },
        }),
      );

      return (response as any).data.stats.floor_price;
    } catch (error) {
      this.logger.error(
        `Ошибка получения данных из OpenSea для ${collectionName}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Вычислить изменения и обновить поля.
   */
  private async calculateChanges(asset: CryptoAsset | NFTAsset): Promise<void> {
    const now = new Date();
    const currentPrice = asset instanceof CryptoAsset ? asset.currentPrice : asset.floorPrice;

    // Инициализация, если не установлено
    if (!asset.dailyPrice) {
      asset.dailyPrice = currentPrice;
      asset.dailyTimestamp = now;
    }
    if (!asset.weeklyPrice) {
      asset.weeklyPrice = currentPrice;
      asset.weeklyTimestamp = now;
    }
    if (!asset.monthlyPrice) {
      asset.monthlyPrice = currentPrice;
      asset.monthlyTimestamp = now;
    }
    if (!asset.quartPrice) {
      asset.quartPrice = currentPrice;
      asset.quartTimestamp = now;
    }
    if (!asset.yearPrice) {
      asset.yearPrice = currentPrice;
      asset.yearTimestamp = now;
    }

    // Обновление ежедневно
    if (this.shouldUpdate(asset.dailyTimestamp, 1, 'day')) {
      asset.dailyChange = this.calculateChange(asset.dailyPrice, currentPrice);
      asset.dailyPrice = currentPrice;
      asset.dailyTimestamp = now;
    }

    // Обновление еженедельно
    if (this.shouldUpdate(asset.weeklyTimestamp, 1, 'week')) {
      asset.weeklyChange = this.calculateChange(asset.weeklyPrice, currentPrice);
      asset.weeklyPrice = currentPrice;
      asset.weeklyTimestamp = now;
    }

    // Обновление ежемесячно
    if (this.shouldUpdate(asset.monthlyTimestamp, 1, 'month')) {
      asset.monthlyChange = this.calculateChange(asset.monthlyPrice, currentPrice);
      asset.monthlyPrice = currentPrice;
      asset.monthlyTimestamp = now;
    }

    // Обновление ежеквартально
    if (this.shouldUpdate(asset.quartTimestamp, 3, 'month')) {
      asset.quartChange = this.calculateChange(asset.quartPrice, currentPrice);
      asset.quartPrice = currentPrice;
      asset.quartTimestamp = now;
    }

    // Обновление ежегодно
    if (this.shouldUpdate(asset.yearTimestamp, 1, 'year')) {
      asset.yearChange = this.calculateChange(asset.yearPrice, currentPrice);
      asset.yearPrice = currentPrice;
      asset.yearTimestamp = now;
    }

    // Общее изменение
    asset.totalChange = this.calculateChange(asset.middlePrice, currentPrice);
  }

  /**
   * Проверить, нужно ли обновлять на основе временного интервала.
   */
  private shouldUpdate(
    lastUpdate: Date,
    amount: number,
    unit: 'day' | 'week' | 'month' | 'year',
  ): boolean {
    if (!lastUpdate) return true;

    const now = new Date();
    const diffTime = now.getTime() - lastUpdate.getTime();

    switch (unit) {
      case 'day':
        return diffTime >= amount * 24 * 60 * 60 * 1000;
      case 'week':
        return diffTime >= amount * 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return diffTime >= amount * 30 * 24 * 60 * 60 * 1000;
      case 'year':
        return diffTime >= amount * 365 * 24 * 60 * 60 * 1000;
      default:
        return false;
    }
  }

  /**
   * Вычислить процентное изменение.
   */
  private calculateChange(oldPrice: number, newPrice: number): number {
    if (oldPrice === 0) return 0;
    return ((newPrice - oldPrice) / oldPrice) * 100;
  }

  /**
   * Сохранить историческую цену.
   */
  private async saveHistoricalPrice(assetId: number, price: number, source: string): Promise<void> {
    try {
      const historicalPrice = this.historicalPriceRepository.create({
        assetId,
        price,
        timestamp: new Date(),
        source,
      });
      await this.historicalPriceRepository.save(historicalPrice);
    } catch (error) {
      this.logger.error(`Error saving historical price for asset ${assetId}: ${error.message}`);
    }
  }
}
