import { Test, TestingModule } from "@nestjs/testing";
import { AssetUpdateService } from "./asset-update.service";
import { HttpService } from "@nestjs/axios";
import { Repository } from "typeorm";
import { Asset, CryptoAsset, NFTAsset } from "./asset.entity";
import { HistoricalPrice } from "./historical-price.entity";
import { AssetRepository } from "./asset.repository";
import { HistoricalPriceRepository } from "./historical-price.repository";
import { UserRepository } from "../auth/user.repository";
import { User } from "../auth/user.entity";
import { NotificationSettings } from "../notifications/core/entities/notification-settings.entity";
import { NotificationSettingsRepository } from "../notifications/core/notification-settings.repository";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { of } from "rxjs";

describe("AssetUpdateService", () => {
  let service: AssetUpdateService;
  let httpService: jest.Mocked<HttpService>;
  let assetRepository: jest.Mocked<AssetRepository>;
  let historicalPriceRepository: jest.Mocked<HistoricalPriceRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let notificationSettingsRepository: jest.Mocked<NotificationSettingsRepository>;

  const mockCryptoAsset = Object.create(CryptoAsset.prototype, {
    id: { value: 1, writable: true },
    type: { value: "crypto", writable: true },
    symbol: { value: "BTC", writable: true },
    userId: { value: 1, writable: true },
    currentPrice: { value: 50000, writable: true },
    middlePrice: { value: 48000, writable: true },
    dailyPrice: { value: 49000, writable: true },
    dailyTimestamp: { value: new Date("2024-01-01"), writable: true },
  }) as CryptoAsset;

  const mockNFTAsset = Object.create(NFTAsset.prototype, {
    id: { value: 2, writable: true },
    type: { value: "nft", writable: true },
    collectionName: { value: "BAYC", writable: true },
    userId: { value: 1, writable: true },
    floorPrice: { value: 15, writable: true },
    floorPriceUsd: { value: 0, writable: true },
    middlePrice: { value: 10, writable: true },
    middlePriceUsd: { value: 0, writable: true },
    nativeToken: { value: "ETH", writable: true },
  }) as NFTAsset;

  const mockUser = {
    id: 1,
    lastUpdated: new Date("2024-01-01"),
  } as User;

  const mockNotificationSettings = {
    userId: 1,
    enabled: true,
    intervalHours: 4,
    updateIntervalHours: 4,
    user: mockUser,
  } as NotificationSettings;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetUpdateService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: AssetRepository,
          useValue: {
            findByUserId: jest.fn(),
            saveAsset: jest.fn(),
          },
        },
        {
          provide: HistoricalPriceRepository,
          useValue: {
            savePrice: jest.fn(),
            findByAssetIdDesc: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: NotificationSettingsRepository,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: UserSettingsService,
          useValue: {
            getUserSettings: jest.fn().mockResolvedValue({
              coinmarketcapApiKey: "test_key",
              openseaApiKey: "test_key",
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AssetUpdateService>(AssetUpdateService);
    httpService = module.get(HttpService);
    assetRepository = module.get(AssetRepository);
    historicalPriceRepository = module.get(HistoricalPriceRepository);
    userRepository = module.get(UserRepository);
    notificationSettingsRepository = module.get(NotificationSettingsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updateAssetsForUsers", () => {
    it("should get settings with relations", async () => {
      notificationSettingsRepository.find.mockResolvedValue([
        mockNotificationSettings,
      ]);
      assetRepository.findByUserId.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      expect(notificationSettingsRepository.find).toHaveBeenCalledWith({
        where: { enabled: true },
        relations: ["user"],
      });
    });

    it("should filter by enabled", async () => {
      const disabledSettings = { ...mockNotificationSettings, enabled: false };
      notificationSettingsRepository.find.mockResolvedValue([disabledSettings]);

      const result = await service.updateAssetsForUsers();

      expect(result).toEqual([]);
    });

    it("should group settings by userId", async () => {
      const user1 = { id: 1, lastUpdated: new Date("2024-01-01") } as User;
      const user2 = { id: 2, lastUpdated: new Date("2024-01-01") } as User;
      const settings1 = { ...mockNotificationSettings, user: user1 };
      const settings2 = { ...mockNotificationSettings, userId: 2, user: user2 };
      notificationSettingsRepository.find.mockResolvedValue([
        settings1,
        settings2,
      ]);
      assetRepository.findByUserId.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      expect(assetRepository.findByUserId).toHaveBeenCalledTimes(2);
    });

    it("should check update interval", async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 5);
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      expect(assetRepository.findByUserId).toHaveBeenCalled();
    });

    it("should skip update if interval not passed", async () => {
      const recentDate = new Date();
      const userWithRecentUpdate = { ...mockUser, lastUpdated: recentDate };
      const settings = {
        ...mockNotificationSettings,
        user: userWithRecentUpdate,
      };

      notificationSettingsRepository.find.mockResolvedValue([settings]);

      await service.updateAssetsForUsers();

      expect(assetRepository.findByUserId).not.toHaveBeenCalled();
    });

    it("should update assets when shouldUpdate is true", async () => {
      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockCryptoAsset]);

      httpService.get.mockReturnValue(
        of({
          data: {
            data: {
              BTC: {
                quote: {
                  USD: { price: 52000 },
                },
              },
            },
          },
        }) as any,
      );

      const result = await service.updateAssetsForUsers();

      expect(result).toContain(1);
    });

    it("should update user.lastUpdated", async () => {
      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      expect(userRepository.save).toHaveBeenCalled();
      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.lastUpdated).toBeInstanceOf(Date);
    });

    it("should return array of updated asset ids", async () => {
      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([
        mockCryptoAsset,
        mockNFTAsset,
      ]);

      httpService.get.mockReturnValue(
        of({
          data: {
            data: {
              BTC: { quote: { USD: { price: 52000 } } },
            },
          },
        }) as any,
      );

      const result = await service.updateAssetsForUsers();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("API calls", () => {
    it("should call CoinMarketCap API with correct URL", async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            data: {
              BTC: { quote: { USD: { price: 52000 } } },
            },
          },
        }) as any,
      );

      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockCryptoAsset]);

      await service.updateAssetsForUsers();

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining("coinmarketcap.com"),
        expect.objectContaining({
          headers: { "X-CMC_PRO_API_KEY": "test_key" },
        }),
      );
    });

    it("should call OpenSea API with correct URL", async () => {
      // First call: OpenSea, second call: CoinMarketCap for ETH price
      httpService.get
        .mockReturnValueOnce(
          of({
            data: { total: { floor_price: 20, floor_price_symbol: "ETH" } },
          }) as any,
        )
        .mockReturnValueOnce(
          of({
            data: { data: { ETH: { quote: { USD: { price: 2800 } } } } },
          }) as any,
        );

      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockNFTAsset]);

      await service.updateAssetsForUsers();

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining("opensea.io"),
        expect.objectContaining({
          headers: { "X-API-KEY": "test_key" },
        }),
      );
    });

    it("should update asset price from API", async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            data: {
              BTC: { quote: { USD: { price: 55000 } } },
            },
          },
        }) as any,
      );

      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockCryptoAsset]);

      await service.updateAssetsForUsers();

      expect(assetRepository.saveAsset).toHaveBeenCalled();
    });

    it("should save historical price", async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            data: {
              BTC: { quote: { USD: { price: 52000 } } },
            },
          },
        }) as any,
      );

      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockCryptoAsset]);

      await service.updateAssetsForUsers();

      expect(historicalPriceRepository.savePrice).toHaveBeenCalled();
    });
  });

  describe("NFT specific", () => {
    it("should parse floor_price from OpenSea total field and calculate floorPriceUsd", async () => {
      // First call: OpenSea (floor_price in ETH), second call: CoinMarketCap (ETH/USD price)
      httpService.get
        .mockReturnValueOnce(
          of({
            data: { total: { floor_price: 2.0, floor_price_symbol: "ETH" } },
          }) as any,
        )
        .mockReturnValueOnce(
          of({
            data: { data: { ETH: { quote: { USD: { price: 2800 } } } } },
          }) as any,
        );

      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockNFTAsset]);
      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      await service.updateAssetsForUsers();

      expect(assetRepository.saveAsset).toHaveBeenCalled();
      const savedAsset = assetRepository.saveAsset.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.floorPrice).toBe(2.0);
      // floorPriceUsd = 2.0 * 2800 = 5600
      expect(savedAsset.floorPriceUsd).toBeCloseTo(5600, 0);
    });

    it("should update NFT asset with floorPrice and calculated floorPriceUsd", async () => {
      // First call: OpenSea, second call: CoinMarketCap for ETH
      httpService.get
        .mockReturnValueOnce(
          of({
            data: { total: { floor_price: 3.5, floor_price_symbol: "ETH" } },
          }) as any,
        )
        .mockReturnValueOnce(
          of({
            data: { data: { ETH: { quote: { USD: { price: 2800 } } } } },
          }) as any,
        );

      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );
      historicalPriceRepository.savePrice.mockResolvedValue({} as any);

      await service.updateNFTAsset(
        mockNFTAsset,
        "test_opensea_key",
        "test_cmc_key",
      );

      expect(mockNFTAsset.floorPrice).toBe(3.5);
      // floorPriceUsd = 3.5 * 2800 = 9800
      expect(mockNFTAsset.floorPriceUsd).toBeCloseTo(9800, 0);
    });

    it("should update nativeToken from OpenSea floorPriceSymbol", async () => {
      httpService.get
        .mockReturnValueOnce(
          of({
            data: { total: { floor_price: 1.0, floor_price_symbol: "SOL" } },
          }) as any,
        )
        .mockReturnValueOnce(
          of({
            data: { data: { SOL: { quote: { USD: { price: 150 } } } } },
          }) as any,
        );

      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );
      historicalPriceRepository.savePrice.mockResolvedValue({} as any);

      await service.updateNFTAsset(
        mockNFTAsset,
        "test_opensea_key",
        "test_cmc_key",
      );

      expect(mockNFTAsset.nativeToken).toBe("SOL");
    });

    it("should not update NFT asset when OpenSea returns no total data", async () => {
      httpService.get.mockReturnValue(
        of({
          data: { total: null },
        }) as any,
      );

      assetRepository.saveAsset.mockClear();

      await service.updateNFTAsset(
        mockNFTAsset,
        "test_opensea_key",
        "test_cmc_key",
      );

      expect(assetRepository.saveAsset).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should log error on API failure", async () => {
      const loggerSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      httpService.get.mockImplementation(() => {
        throw new Error("API Error");
      });

      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockCryptoAsset]);

      await service.updateAssetsForUsers();

      loggerSpy.mockRestore();
    });
  });

  // ─── sub_task_2: TDD тесты updateIntervalHours + thresholdPercent ─────────

  describe("updateIntervalHours usage in shouldUpdate logic", () => {
    it("should NOT update assets when updateIntervalHours has not passed (even if intervalHours has)", async () => {
      // updateIntervalHours=4, intervalHours=2
      // lastUpdated = 3 часа назад → 3ч < 4ч updateIntervalHours → НЕ обновляем
      const threeHoursAgo = new Date();
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
      const user = { id: 1, lastUpdated: threeHoursAgo } as User;

      const settings = {
        ...mockNotificationSettings,
        intervalHours: 2, // кулдаун алертов — прошёл (3ч > 2ч)
        updateIntervalHours: 4, // интервал обновления — НЕ прошёл (3ч < 4ч)
        user,
      } as NotificationSettings;

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      // Активы НЕ должны обновляться — updateIntervalHours не прошёл
      // assetRepository.findByUserId не должен быть вызван (или вызван 0 раз)
      expect(assetRepository.findByUserId).not.toHaveBeenCalled();
    });

    it("should update assets when updateIntervalHours has passed", async () => {
      // updateIntervalHours=4, lastUpdated = 5 часов назад → обновляем
      const fiveHoursAgo = new Date();
      fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);
      const user = { id: 1, lastUpdated: fiveHoursAgo } as User;

      const settings = {
        ...mockNotificationSettings,
        intervalHours: 4,
        updateIntervalHours: 4, // прошло 5ч >= 4ч → обновляем
        user,
      } as NotificationSettings;

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      // Активы должны обновляться
      expect(assetRepository.findByUserId).toHaveBeenCalled();
    });

    it("should use max updateIntervalHours across multiple settings for same user", async () => {
      // Если у пользователя 2 настройки: updateIntervalHours=2 и updateIntervalHours=8
      // берём max=8, lastUpdated=5ч назад → 5ч < 8ч → НЕ обновляем
      const fiveHoursAgo = new Date();
      fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);
      const user = { id: 1, lastUpdated: fiveHoursAgo } as User;

      const settings1 = {
        ...mockNotificationSettings,
        userId: 1,
        updateIntervalHours: 2,
        user,
      } as NotificationSettings;
      const settings2 = {
        ...mockNotificationSettings,
        userId: 1,
        updateIntervalHours: 8,
        user,
      } as NotificationSettings;

      notificationSettingsRepository.find.mockResolvedValue([
        settings1,
        settings2,
      ]);
      assetRepository.findByUserId.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      // max(2,8)=8, прошло 5ч < 8ч → НЕ обновляем
      expect(assetRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe("thresholdPercent in alerts", () => {
    it("should continue with other assets on error", async () => {
      httpService.get.mockImplementation(() => {
        throw new Error("API Error");
      });

      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([
        mockCryptoAsset,
        mockNFTAsset,
      ]);

      const result = await service.updateAssetsForUsers();

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it("should handle missing API key gracefully", async () => {
      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockCryptoAsset]);

      await expect(service.updateAssetsForUsers()).resolves.not.toThrow();
    });

    it("should not crash on error", async () => {
      httpService.get.mockImplementation(() => {
        throw new Error("Network error");
      });

      const oldDate = new Date("2024-01-01");
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetRepository.findByUserId.mockResolvedValue([mockCryptoAsset]);

      await expect(service.updateAssetsForUsers()).resolves.not.toThrow();
    });
  });
});
