/**
 * @fileoverview Сервис для управления активами.
 *
 * Этот файл содержит бизнес-логику для работы с активами.
 * Сервисы в NestJS - это провайдеры, которые инкапсулируют логику приложения,
 * взаимодействуют с базой данных через репозитории и предоставляют методы
 * для контроллеров и других сервисов.
 *
 * @Injectable декоратор регистрирует класс как провайдер в контейнере зависимостей,
 * позволяя его инжектировать в другие компоненты.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Asset, CryptoAsset, NFTAsset } from './asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetUpdateService } from './asset-update.service';

/**
 * Сервис для операций с активами.
 *
 * Предоставляет методы CRUD для управления активами в базе данных.
 * Использует репозиторий TypeORM для взаимодействия с данными.
 *
 * @Injectable декоратор делает класс доступным для dependency injection,
 * что позволяет NestJS автоматически создавать экземпляры и управлять зависимостями.
 */
@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    private readonly httpService: HttpService,
    private readonly assetUpdateService: AssetUpdateService,
  ) {}

  /**
   * Получить все активы.
   *
   * @returns Promise с массивом всех активов из базы данных.
   */
  findAll(): Promise<Asset[]> {
    return this.assetsRepository.find();
  }

  /**
   * Найти актив по ID.
   *
   * @param id Уникальный идентификатор актива.
   * @returns Promise с активом или null, если не найден.
   */
  findOne(id: number): Promise<Asset | null> {
    return this.assetsRepository.findOneBy({ id });
  }

  /**
   * Создать новый актив.
   *
   * @param createAssetDto DTO с данными для создания актива.
   * @returns Promise с созданным активом.
   */
  async create(createAssetDto: CreateAssetDto & { userId?: number }): Promise<Asset> {
    let asset: Asset;
    let currentPrice = createAssetDto.currentPrice;

    if (createAssetDto.type === 'crypto') {
      if (!currentPrice) {
        currentPrice = (await this.getCryptoPrice(createAssetDto.symbol!)) || 0;
      }

      asset = new CryptoAsset();
      asset.type = 'crypto';
      asset.amount = createAssetDto.amount;
      asset.middlePrice = createAssetDto.middlePrice;
      asset.previousPrice = 0;
      asset.multiple = currentPrice && createAssetDto.middlePrice 
        ? currentPrice / createAssetDto.middlePrice 
        : 0;
      asset.dailyChange = 0;
      asset.weeklyChange = 0;
      asset.monthlyChange = 0;
      asset.quartChange = 0;
      asset.yearChange = 0;
      asset.totalChange = currentPrice && createAssetDto.middlePrice 
        ? ((currentPrice - createAssetDto.middlePrice) / createAssetDto.middlePrice) * 100 
        : 0;
      asset.userId = createAssetDto.userId || 0;
      (asset as CryptoAsset).symbol = createAssetDto.symbol!;
      (asset as CryptoAsset).fullName = createAssetDto.fullName!;
      (asset as CryptoAsset).currentPrice = currentPrice;
    } else {
      asset = new NFTAsset();
      asset.type = 'nft';
      asset.amount = createAssetDto.amount;
      asset.middlePrice = createAssetDto.middlePrice;
      asset.previousPrice = 0;
      asset.multiple = 0;
      asset.dailyChange = 0;
      asset.weeklyChange = 0;
      asset.monthlyChange = 0;
      asset.quartChange = 0;
      asset.yearChange = 0;
      asset.totalChange = 0;
      asset.userId = createAssetDto.userId || 0;
      (asset as NFTAsset).collectionName = createAssetDto.collectionName!;
      (asset as NFTAsset).floorPrice = createAssetDto.floorPrice!;
      (asset as NFTAsset).traitPrice = createAssetDto.traitPrice!;
    }
    return this.assetsRepository.save(asset);
  }

  /**
   * Обновить существующий актив.
   *
   * @param id Идентификатор актива для обновления.
   * @param updateAssetDto DTO с данными для обновления.
   * @returns Promise с обновленным активом или null, если не найден.
   */
  async update(id: number, updateAssetDto: UpdateAssetDto): Promise<Asset | null> {
    await this.assetsRepository.update(id, updateAssetDto);
    return this.findOne(id);
  }

  /**
   * Удалить актив.
   *
   * @param id Идентификатор актива для удаления.
   * @returns Promise, который разрешается после удаления.
   */
  async remove(id: number): Promise<void> {
    await this.assetsRepository.delete(id);
  }

  async getCryptoPrice(symbol: string): Promise<number | null> {
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
      this.logger.error(`Ошибка получения цены ${symbol}: ${error.message}`);
      return null;
    }
  }

  async refreshAll(userId: number): Promise<Asset[]> {
    await this.assetUpdateService.updateAssetsForUser(userId);
    return this.assetsRepository.find({ where: { userId } });
  }
}
