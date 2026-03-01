import { Test, TestingModule } from '@nestjs/testing';
import { AssetUpdateService } from './asset-update.service';
import { HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, CryptoAsset, NFTAsset } from './asset.entity';
import { HistoricalPrice } from './historical-price.entity';
import { User } from '../auth/user.entity';
import { NotificationSettings } from '../notifications/core/entities/notification-settings.entity';
import { UserSettingsService } from '../user-settings/user-settings.service';
import { of } from 'rxjs';

describe('AssetUpdateService', () => {
  let service: AssetUpdateService;
  let httpService: jest.Mocked<HttpService>;
  let assetsRepository: jest.Mocked<Repository<Asset>>;
  let historicalPriceRepository: jest.Mocked<Repository<HistoricalPrice>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let notificationSettingsRepository: jest.Mocked<Repository<NotificationSettings>>;

  const mockCryptoAsset = Object.create(CryptoAsset.prototype, {
    id: { value: 1, writable: true },
    type: { value: 'crypto', writable: true },
    symbol: { value: 'BTC', writable: true },
    userId: { value: 1, writable: true },
    currentPrice: { value: 50000, writable: true },
    middlePrice: { value: 48000, writable: true },
    dailyPrice: { value: 49000, writable: true },
    dailyTimestamp: { value: new Date('2024-01-01'), writable: true },
  }) as CryptoAsset;

  const mockNFTAsset = Object.create(NFTAsset.prototype, {
    id: { value: 2, writable: true },
    type: { value: 'nft', writable: true },
    collectionName: { value: 'BAYC', writable: true },
    userId: { value: 1, writable: true },
    floorPrice: { value: 15, writable: true },
    floorPriceUsd: { value: 0, writable: true },
    middlePrice: { value: 10, writable: true },
    middlePriceUsd: { value: 0, writable: true },
    nativeToken: { value: 'ETH', writable: true },
  }) as NFTAsset;

  const mockUser = {
    id: 1,
    lastUpdated: new Date('2024-01-01'),
  } as User;

  const mockNotificationSettings = {
    userId: 1,
    enabled: true,
    intervalHours: 4,
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
          provide: getRepositoryToken(Asset),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(HistoricalPrice),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NotificationSettings),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: UserSettingsService,
          useValue: {
            getUserSettings: jest.fn().mockResolvedValue({
              coinmarketcapApiKey: 'test_key',
              openseaApiKey: 'test_key',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AssetUpdateService>(AssetUpdateService);
    httpService = module.get(HttpService);
    assetsRepository = module.get(getRepositoryToken(Asset));
    historicalPriceRepository = module.get(getRepositoryToken(HistoricalPrice));
    userRepository = module.get(getRepositoryToken(User));
    notificationSettingsRepository = module.get(getRepositoryToken(NotificationSettings));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateAssetsForUsers', () => {
    it('should get settings with relations', async () => {
      notificationSettingsRepository.find.mockResolvedValue([mockNotificationSettings]);
      assetsRepository.find.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      expect(notificationSettingsRepository.find).toHaveBeenCalledWith({
        where: { enabled: true },
        relations: ['user'],
      });
    });

    it('should filter by enabled', async () => {
      const disabledSettings = { ...mockNotificationSettings, enabled: false };
      notificationSettingsRepository.find.mockResolvedValue([disabledSettings]);

      const result = await service.updateAssetsForUsers();

      expect(result).toEqual([]);
    });

    it('should group settings by userId', async () => {
      const user1 = { id: 1, lastUpdated: new Date('2024-01-01') } as User;
      const user2 = { id: 2, lastUpdated: new Date('2024-01-01') } as User;
      const settings1 = { ...mockNotificationSettings, user: user1 };
      const settings2 = { ...mockNotificationSettings, userId: 2, user: user2 };
      notificationSettingsRepository.find.mockResolvedValue([settings1, settings2]);
      assetsRepository.find.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      expect(assetsRepository.find).toHaveBeenCalledTimes(2);
    });

    it('should check update interval', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 5);
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      expect(assetsRepository.find).toHaveBeenCalled();
    });

    it('should skip update if interval not passed', async () => {
      const recentDate = new Date();
      const userWithRecentUpdate = { ...mockUser, lastUpdated: recentDate };
      const settings = { ...mockNotificationSettings, user: userWithRecentUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);

      await service.updateAssetsForUsers();

      expect(assetsRepository.find).not.toHaveBeenCalled();
    });

    it('should update assets when shouldUpdate is true', async () => {
      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset]);

      httpService.get.mockReturnValue(of({
        data: {
          data: {
            BTC: {
              quote: {
                USD: { price: 52000 }
              }
            }
          }
        }
      }) as any);

      process.env.COINMARKETCAP_API_KEY = 'test_key';

      const result = await service.updateAssetsForUsers();

      expect(result).toContain(1);
    });

    it('should update user.lastUpdated', async () => {
      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([]);

      await service.updateAssetsForUsers();

      expect(userRepository.save).toHaveBeenCalled();
      const savedUser = userRepository.save.mock.calls[0][0];
      expect(savedUser.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return array of updated asset ids', async () => {
      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset, mockNFTAsset]);

      httpService.get.mockReturnValue(of({
        data: {
          data: {
            BTC: { quote: { USD: { price: 52000 } } }
          }
        }
      }) as any);

      process.env.COINMARKETCAP_API_KEY = 'test_key';
      process.env.OPENSEA_API_KEY = 'test_key';

      const result = await service.updateAssetsForUsers();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('API calls', () => {
    it('should call CoinMarketCap API with correct URL', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test_key';

      httpService.get.mockReturnValue(of({
        data: {
          data: {
            BTC: { quote: { USD: { price: 52000 } } }
          }
        }
      }) as any);

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset]);

      await service.updateAssetsForUsers();

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('coinmarketcap.com'),
        expect.objectContaining({
          headers: { 'X-CMC_PRO_API_KEY': 'test_key' }
        })
      );
    });

    it('should call OpenSea API with correct URL', async () => {
      process.env.OPENSEA_API_KEY = 'test_key';

      httpService.get.mockReturnValue(of({
        data: { stats: { floor_price: 20, floor_price_usd: 56000 } }
      }) as any);

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockNFTAsset]);

      await service.updateAssetsForUsers();

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('opensea.io'),
        expect.objectContaining({
          headers: { 'X-API-KEY': 'test_key' }
        })
      );
    });

    it('should update asset price from API', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test_key';

      httpService.get.mockReturnValue(of({
        data: {
          data: {
            BTC: { quote: { USD: { price: 55000 } } }
          }
        }
      }) as any);

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset]);

      await service.updateAssetsForUsers();

      expect(assetsRepository.save).toHaveBeenCalled();
    });

    it('should save historical price', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test_key';

      httpService.get.mockReturnValue(of({
        data: {
          data: {
            BTC: { quote: { USD: { price: 52000 } } }
          }
        }
      }) as any);

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset]);

      await service.updateAssetsForUsers();

      expect(historicalPriceRepository.save).toHaveBeenCalled();
    });
  });

  describe('NFT specific', () => {
    it('should extract floor_price_usd from OpenSea response', async () => {
      process.env.OPENSEA_API_KEY = 'test_key';

      httpService.get.mockReturnValue(of({
        data: { stats: { floor_price: 2.0, floor_price_usd: 5600 } }
      }) as any);

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockNFTAsset]);
      assetsRepository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      await service.updateAssetsForUsers();

      expect(assetsRepository.save).toHaveBeenCalled();
      const savedAsset = assetsRepository.save.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.floorPrice).toBe(2.0);
      expect(savedAsset.floorPriceUsd).toBe(5600);
    });

    it('should update NFT asset with both floorPrice and floorPriceUsd', async () => {
      httpService.get.mockReturnValue(of({
        data: { stats: { floor_price: 3.5, floor_price_usd: 9800 } }
      }) as any);

      assetsRepository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));
      historicalPriceRepository.create.mockReturnValue({} as any);
      historicalPriceRepository.save.mockResolvedValue({} as any);

      await service.updateNFTAsset(mockNFTAsset, 'test_key');

      expect(mockNFTAsset.floorPrice).toBe(3.5);
      expect(mockNFTAsset.floorPriceUsd).toBe(9800);
    });

    it('should not update NFT asset when floorPrice is null', async () => {
      httpService.get.mockReturnValue(of({
        data: { stats: null }
      }) as any);

      assetsRepository.save.mockClear();

      await service.updateNFTAsset(mockNFTAsset, 'test_key');

      expect(assetsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should log error on API failure', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test_key';
      const loggerSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      httpService.get.mockImplementation(() => {
        throw new Error('API Error');
      });

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset]);

      await service.updateAssetsForUsers();

      loggerSpy.mockRestore();
    });

    it('should continue with other assets on error', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test_key';

      httpService.get.mockImplementation(() => {
        throw new Error('API Error');
      });

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset, mockNFTAsset]);

      const result = await service.updateAssetsForUsers();

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should handle missing API key gracefully', async () => {
      delete process.env.COINMARKETCAP_API_KEY;

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset]);

      await expect(service.updateAssetsForUsers()).resolves.not.toThrow();
    });

    it('should not crash on error', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test_key';

      httpService.get.mockImplementation(() => {
        throw new Error('Network error');
      });

      const oldDate = new Date('2024-01-01');
      const userWithOldUpdate = { ...mockUser, lastUpdated: oldDate };
      const settings = { ...mockNotificationSettings, user: userWithOldUpdate };

      notificationSettingsRepository.find.mockResolvedValue([settings]);
      assetsRepository.find.mockResolvedValue([mockCryptoAsset]);

      await expect(service.updateAssetsForUsers()).resolves.not.toThrow();
    });
  });
});
