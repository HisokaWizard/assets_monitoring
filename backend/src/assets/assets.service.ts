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

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { Asset, CryptoAsset, NFTAsset } from "./asset.entity";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";
import { AssetUpdateService } from "./asset-update.service";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { User } from "../auth/user.entity";
import { CoinMarketCapResponse } from "./interfaces/api-responses.interface";

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
    private readonly userSettingsService: UserSettingsService,
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
  async create(
    createAssetDto: CreateAssetDto & { userId?: number },
  ): Promise<Asset> {
    let asset: Asset;
    let currentPrice: number | null = null;

    // Получить ключи пользователя один раз для любого типа актива
    let coinmarketcapApiKey: string | undefined;
    let openseaApiKey: string | undefined;
    if (createAssetDto.userId) {
      const userSettings = await this.userSettingsService.getUserSettings({
        id: createAssetDto.userId,
      } as User);
      coinmarketcapApiKey = userSettings?.coinmarketcapApiKey || undefined;
      openseaApiKey = userSettings?.openseaApiKey || undefined;
    }

    if (createAssetDto.type === "crypto") {
      currentPrice =
        createAssetDto.currentPrice ||
        (await this.getCryptoPrice(
          createAssetDto.symbol!,
          coinmarketcapApiKey,
        ));

      asset = new CryptoAsset();
      asset.type = "crypto";
      asset.amount = createAssetDto.amount;
      asset.middlePrice = createAssetDto.middlePrice;
      asset.previousPrice = 0;
      asset.multiple =
        currentPrice && createAssetDto.middlePrice
          ? currentPrice / createAssetDto.middlePrice
          : 0;
      asset.dailyChange = 0;
      asset.weeklyChange = 0;
      asset.monthlyChange = 0;
      asset.quartChange = 0;
      asset.yearChange = 0;
      asset.totalChange =
        currentPrice && createAssetDto.middlePrice
          ? ((currentPrice - createAssetDto.middlePrice) /
              createAssetDto.middlePrice) *
            100
          : 0;
      asset.userId = createAssetDto.userId || 0;
      (asset as CryptoAsset).symbol = createAssetDto.symbol!;
      (asset as CryptoAsset).fullName = createAssetDto.fullName!;
      (asset as CryptoAsset).currentPrice = currentPrice || 0;
    } else {
      const collectionName = createAssetDto.collectionName!;

      // Получить актуальный floorPrice и floorPriceUsd из OpenSea (оба ключа пользователя)
      let floorPrice = createAssetDto.floorPrice || 0;
      let floorPriceUsd = 0;
      let nativeToken = createAssetDto.nativeToken || "ETH";

      const opensea = await this.assetUpdateService.fetchFromOpenSea(
        collectionName,
        openseaApiKey,
        coinmarketcapApiKey,
      );
      if (opensea.floorPrice !== null) {
        floorPrice = opensea.floorPrice;
        floorPriceUsd = opensea.floorPriceUsd ?? 0;
        // Использовать токен из OpenSea как авторитетный источник
        if (opensea.floorPriceSymbol) {
          nativeToken = opensea.floorPriceSymbol;
        }
      }

      // Рассчитать middlePriceUsd = middlePrice * курс нативного токена (ключ пользователя)
      let middlePriceUsd = 0;
      const tokenPrice = await this.getCryptoPrice(
        nativeToken,
        coinmarketcapApiKey,
      );
      if (tokenPrice && createAssetDto.middlePrice) {
        middlePriceUsd = createAssetDto.middlePrice * tokenPrice;
      }

      asset = new NFTAsset();
      asset.type = "nft";
      asset.amount = createAssetDto.amount;
      asset.middlePrice = createAssetDto.middlePrice;
      asset.previousPrice = 0;
      asset.multiple =
        floorPrice && createAssetDto.middlePrice
          ? floorPrice / createAssetDto.middlePrice
          : 0;
      asset.dailyChange = 0;
      asset.weeklyChange = 0;
      asset.monthlyChange = 0;
      asset.quartChange = 0;
      asset.yearChange = 0;
      asset.totalChange =
        floorPrice && createAssetDto.middlePrice
          ? ((floorPrice - createAssetDto.middlePrice) /
              createAssetDto.middlePrice) *
            100
          : 0;
      asset.userId = createAssetDto.userId || 0;
      (asset as NFTAsset).collectionName = collectionName;
      (asset as NFTAsset).nativeToken = nativeToken;
      (asset as NFTAsset).floorPrice = floorPrice;
      (asset as NFTAsset).floorPriceUsd = floorPriceUsd;
      (asset as NFTAsset).middlePriceUsd = middlePriceUsd;
      (asset as NFTAsset).traitPrice = createAssetDto.traitPrice || 0;
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
  async update(
    id: number,
    updateAssetDto: UpdateAssetDto,
  ): Promise<Asset | null> {
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

  async getCryptoPrice(
    symbol: string,
    apiKey?: string,
  ): Promise<number | null> {
    try {
      if (!apiKey) {
        this.logger.warn(
          "CoinMarketCap API key не установлен для пользователя",
        );
        return null;
      }

      const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { "X-CMC_PRO_API_KEY": apiKey },
        }),
      );

      const data = (response.data as CoinMarketCapResponse).data[
        symbol.toUpperCase()
      ];
      return data ? data.quote.USD.price : null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Ошибка получения цены ${symbol}: ${errorMessage}`);
      return null;
    }
  }

  async refreshAll(userId: number): Promise<Asset[]> {
    await this.assetUpdateService.updateAssetsForUser(userId);
    return this.assetsRepository.find({ where: { userId } });
  }

  async refreshNFTs(userId: number): Promise<Asset[]> {
    const nftAssets = await this.assetsRepository.find({
      where: { userId, type: "nft" },
    });

    // Получить API ключи пользователя
    const userSettingsData = await this.userSettingsService.getUserSettings({
      id: userId,
    } as User);
    const openseaApiKey = userSettingsData?.openseaApiKey || undefined;
    const coinmarketcapApiKey =
      userSettingsData?.coinmarketcapApiKey || undefined;

    for (const asset of nftAssets) {
      try {
        await this.assetUpdateService.updateNFTAsset(
          asset as NFTAsset,
          openseaApiKey,
          coinmarketcapApiKey,
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(`Ошибка обновления NFT ${asset.id}: ${errorMessage}`);
      }
    }

    return this.assetsRepository.find({ where: { userId, type: "nft" } });
  }
}
