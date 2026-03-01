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
import { UserSettingsService } from '../user-settings/user-settings.service';

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
    private readonly userSettingsService: UserSettingsService,
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
      const user = userSettings[0].user;

      // Получить API ключи пользователя (дешифрованные)
      const userSettingsData = await this.userSettingsService.getUserSettings({ id: userId } as User);

      const coinmarketcapApiKey = userSettingsData?.coinmarketcapApiKey;
      const openseaApiKey = userSettingsData?.openseaApiKey;

      // Пропустить если нет API ключей
      if (!coinmarketcapApiKey && !openseaApiKey) {
        this.logger.warn(`У пользователя ${userId} нет сохраненных API ключей, пропускаем обновление`);
        continue;
      }

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
            if (asset.type === 'crypto') {
              await this.updateCryptoAsset(asset as CryptoAsset, coinmarketcapApiKey || undefined);
            } else if (asset.type === 'nft') {
              await this.updateNFTAsset(asset as NFTAsset, openseaApiKey || undefined, coinmarketcapApiKey || undefined);
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

  async updateAssetsForUser(userId: number): Promise<number[]> {
    const updatedAssetIds: number[] = [];
    const userSettingsData = await this.userSettingsService.getUserSettings({ id: userId } as User);

    const coinmarketcapApiKey = userSettingsData?.coinmarketcapApiKey;
    const openseaApiKey = userSettingsData?.openseaApiKey;

    if (!coinmarketcapApiKey && !openseaApiKey) {
      this.logger.warn(`У пользователя ${userId} нет сохраненных API ключей`);
      return updatedAssetIds;
    }

    const assets = await this.assetsRepository.find({ where: { userId } });

    for (const asset of assets) {
      try {
        if (asset.type === 'crypto') {
          await this.updateCryptoAsset(asset as CryptoAsset, coinmarketcapApiKey || undefined);
        } else if (asset.type === 'nft') {
          await this.updateNFTAsset(asset as NFTAsset, openseaApiKey || undefined, coinmarketcapApiKey || undefined);
        }
        updatedAssetIds.push(asset.id);
      } catch (error) {
        this.logger.error(`Ошибка обновления актива ${asset.id}: ${error.message}`);
      }
    }

    return updatedAssetIds;
  }

  /**
   * Обновить криптоактив.
   */
  private async updateCryptoAsset(asset: CryptoAsset, apiKey?: string): Promise<void> {
    const newPrice = await this.fetchFromCoinMarketCap(asset.symbol, apiKey);
    if (newPrice) {
      // Запомнить предыдущую цену перед обновлением
      asset.previousPrice = asset.currentPrice || 0;
      asset.currentPrice = newPrice;
      // Пересчитать multiple
      asset.multiple = asset.middlePrice ? newPrice / asset.middlePrice : 0;
      // Сохранить историческую цену (USD)
      await this.saveHistoricalPrice(asset.id, newPrice, 'CoinMarketCap');
      // Рассчитать изменения по историческим данным
      await this.calculateChanges(asset);
      await this.assetsRepository.save(asset);
    }
  }

  /**
   * Обновить NFT актив.
   *
   * Получает floorPrice (в нативном токене), floorPriceSymbol и рассчитывает
   * floorPriceUsd через курс токена из CoinMarketCap.
   */
  async updateNFTAsset(asset: NFTAsset, openseaApiKey?: string, coinmarketcapApiKey?: string): Promise<void> {
    const { floorPrice, floorPriceUsd, floorPriceSymbol } = await this.fetchFromOpenSea(
      asset.collectionName,
      openseaApiKey,
      coinmarketcapApiKey,
    );
    if (floorPrice !== null) {
      // Запомнить предыдущую цену перед обновлением
      asset.previousPrice = asset.floorPrice || 0;
      asset.floorPrice = floorPrice;
      if (floorPriceUsd !== null) {
        asset.floorPriceUsd = floorPriceUsd;
      }
      // Обновить nativeToken из OpenSea если он пришёл (авторитетный источник)
      if (floorPriceSymbol) {
        asset.nativeToken = floorPriceSymbol;
      }
      // Пересчитать multiple
      asset.multiple = asset.middlePrice ? floorPrice / asset.middlePrice : 0;
      // Пересчитать middlePriceUsd по актуальному курсу токена
      if (floorPriceUsd !== null && floorPrice > 0) {
        const tokenUsdRate = floorPriceUsd / floorPrice;
        asset.middlePriceUsd = asset.middlePrice ? asset.middlePrice * tokenUsdRate : 0;
      }
      // Сохранить историческую цену (USD для единообразия)
      const priceForHistory = floorPriceUsd ?? floorPrice;
      await this.saveHistoricalPrice(asset.id, priceForHistory, 'OpenSea');
      // Рассчитать изменения по историческим данным
      await this.calculateChanges(asset);
      await this.assetsRepository.save(asset);
    }
  }

  /**
   * Получить данные из CoinMarketCap API.
   */
  private async fetchFromCoinMarketCap(symbol: string, apiKey?: string): Promise<number | null> {
    try {
      const key = apiKey;
      if (!key) {
        this.logger.warn('CoinMarketCap API key не установлен для пользователя');
        return null;
      }

      const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { 'X-CMC_PRO_API_KEY': key },
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
   * Получить данные из OpenSea API v2.
   *
   * OpenSea API v2 /collections/{slug}/stats возвращает данные в поле `total`:
   *   - total.floor_price — цена пола в нативном токене
   *   - total.floor_price_symbol — символ токена (ETH, SOL, WETH и т.д.)
   *
   * floorPriceUsd рассчитывается как floorPrice * курс токена через CoinMarketCap.
   */
  async fetchFromOpenSea(
    collectionName: string,
    openseaApiKey?: string,
    coinmarketcapApiKey?: string,
  ): Promise<{ floorPrice: number | null; floorPriceUsd: number | null; floorPriceSymbol: string | null }> {
    try {
      const key = openseaApiKey;
      if (!key) {
        this.logger.warn('OpenSea API key не установлен для пользователя');
        return { floorPrice: null, floorPriceUsd: null, floorPriceSymbol: null };
      }

      const url = `https://api.opensea.io/api/v2/collections/${collectionName}/stats`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { 'X-API-KEY': key },
        }),
      );

      // OpenSea API v2: данные находятся в поле "total", а не "stats"
      const total = (response as any).data?.total;
      const floorPrice: number | null = total?.floor_price ?? null;
      const floorPriceSymbol: string | null = total?.floor_price_symbol ?? null;

      // Рассчитать floorPriceUsd через CoinMarketCap (ключ пользователя)
      let floorPriceUsd: number | null = null;
      if (floorPrice !== null && floorPriceSymbol) {
        const tokenPrice = await this.fetchFromCoinMarketCap(floorPriceSymbol, coinmarketcapApiKey);
        if (tokenPrice !== null) {
          floorPriceUsd = floorPrice * tokenPrice;
        }
      }

      return { floorPrice, floorPriceUsd, floorPriceSymbol };
    } catch (error) {
      this.logger.error(
        `Ошибка получения данных из OpenSea для ${collectionName}: ${error.message}`,
      );
      return { floorPrice: null, floorPriceUsd: null, floorPriceSymbol: null };
    }
  }

  /**
   * Вычислить изменения на основе исторических данных.
   *
   * Для каждого периода (день, неделя, месяц, квартал, год) находим в historical_price
   * ближайшую запись, которая старше порогового времени — и считаем % и $ изменение
   * относительно неё. Если данных за период нет — значение остаётся 0.
   *
   * Для crypto: currentPrice в USD, история хранит USD-цены.
   * Для NFT: floorPriceUsd в USD, история хранит USD-цены (floorPriceUsd).
   *
   * middlePrice для crypto — в USD. Для NFT middlePriceUsd — в USD.
   */
  private async calculateChanges(asset: CryptoAsset | NFTAsset): Promise<void> {
    const isCrypto = asset instanceof CryptoAsset;
    const currentPrice = isCrypto
      ? (asset as CryptoAsset).currentPrice
      : ((asset as NFTAsset).floorPriceUsd ?? (asset as NFTAsset).floorPrice);

    const middlePriceUsd = isCrypto
      ? asset.middlePrice
      : ((asset as NFTAsset).middlePriceUsd ?? asset.middlePrice);

    // Получить историю для актива (последние 400 записей — достаточно для года)
    const history = await this.historicalPriceRepository.find({
      where: { assetId: asset.id },
      order: { timestamp: 'DESC' },
      take: 400,
    });

    const now = Date.now();

    // Пороги периодов в миллисекундах
    const periods: Array<{
      minAge: number;
      changeField: keyof typeof asset;
      changeUsdField: keyof typeof asset;
    }> = [
      { minAge: 24 * 60 * 60 * 1000,           changeField: 'dailyChange',   changeUsdField: 'dailyChangeUsd' },
      { minAge: 7 * 24 * 60 * 60 * 1000,        changeField: 'weeklyChange',  changeUsdField: 'weeklyChangeUsd' },
      { minAge: 30 * 24 * 60 * 60 * 1000,       changeField: 'monthlyChange', changeUsdField: 'monthlyChangeUsd' },
      { minAge: 90 * 24 * 60 * 60 * 1000,       changeField: 'quartChange',   changeUsdField: 'quartChangeUsd' },
      { minAge: 365 * 24 * 60 * 60 * 1000,      changeField: 'yearChange',    changeUsdField: 'yearChangeUsd' },
    ];

    for (const { minAge, changeField, changeUsdField } of periods) {
      // Найти ближайшую запись старше minAge (т.е. первую запись что старше порога)
      const threshold = now - minAge;
      const refRecord = history.find(h => new Date(h.timestamp).getTime() <= threshold);
      if (refRecord) {
        const refPrice = Number(refRecord.price);
        (asset as any)[changeField] = refPrice !== 0
          ? ((currentPrice - refPrice) / refPrice) * 100
          : 0;
        (asset as any)[changeUsdField] = currentPrice - refPrice;
      }
      // Если записей за период нет — оставляем текущее значение (не обнуляем)
    }

    // totalChange % и $ vs средней цены покупки
    asset.totalChange = middlePriceUsd !== 0
      ? ((currentPrice - middlePriceUsd) / middlePriceUsd) * 100
      : 0;
    asset.totalChangeUsd = currentPrice - middlePriceUsd;
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
