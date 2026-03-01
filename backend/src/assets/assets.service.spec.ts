import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { Asset, CryptoAsset, NFTAsset } from './asset.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAssetDto } from './dto/create-asset.dto';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AssetUpdateService } from './asset-update.service';
import { UserSettingsService } from '../user-settings/user-settings.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let repository: jest.Mocked<Repository<Asset>>;
  let httpService: jest.Mocked<HttpService>;

  const mockCryptoAsset = {
    id: 1,
    amount: 1.5,
    middlePrice: 50000,
    previousPrice: 0,
    multiple: 0,
    dailyChange: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    quartChange: 0,
    yearChange: 0,
    totalChange: 0,
    symbol: 'BTC',
    fullName: 'Bitcoin',
    currentPrice: 52000,
  } as unknown as CryptoAsset;

  const mockNFTAsset = {
    id: 2,
    amount: 1,
    middlePrice: 10,
    previousPrice: 0,
    multiple: 0,
    dailyChange: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    quartChange: 0,
    yearChange: 0,
    totalChange: 0,
    collectionName: 'Bored Ape Yacht Club',
    floorPrice: 15,
    floorPriceUsd: 42000,
    middlePriceUsd: 28000,
    nativeToken: 'ETH',
    traitPrice: 20,
  } as unknown as NFTAsset;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: getRepositoryToken(Asset),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(of({ data: { data: null } } as any)),
          },
        },
        {
          provide: AssetUpdateService,
          useValue: {
            updateAssetsForUser: jest.fn(),
            updateNFTAsset: jest.fn(),
          },
        },
        {
          provide: UserSettingsService,
          useValue: {
            getUserSettings: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    repository = module.get(getRepositoryToken(Asset));
    httpService = module.get(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of assets', async () => {
      repository.find.mockResolvedValue([mockCryptoAsset, mockNFTAsset]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect((result[0] as CryptoAsset).symbol).toBe('BTC');
      expect((result[1] as NFTAsset).collectionName).toBe('Bored Ape Yacht Club');
    });

    it('should work with empty array', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return mixed types', async () => {
      repository.find.mockResolvedValue([mockCryptoAsset, mockNFTAsset, mockCryptoAsset]);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect((result[0] as CryptoAsset).symbol).toBeDefined();
      expect((result[1] as NFTAsset).collectionName).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return asset by id', async () => {
      repository.findOneBy.mockResolvedValue(mockCryptoAsset);

      const result = await service.findOne(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockCryptoAsset);
    });

    it('should return null if not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('should work with CryptoAsset', async () => {
      repository.findOneBy.mockResolvedValue(mockCryptoAsset);

      const result = await service.findOne(1);

      expect((result as CryptoAsset)?.symbol).toBe('BTC');
    });

    it('should work with NFTAsset', async () => {
      repository.findOneBy.mockResolvedValue(mockNFTAsset);

      const result = await service.findOne(2);

      expect((result as NFTAsset)?.collectionName).toBe('Bored Ape Yacht Club');
    });
  });

  describe('create', () => {
    it('should create CryptoAsset with all fields', async () => {
      const createDto: CreateAssetDto = {
        type: 'crypto',
        amount: 1.5,
        middlePrice: 50000,
        symbol: 'BTC',
        fullName: 'Bitcoin',
        currentPrice: 52000,
      };

      repository.save.mockResolvedValue(mockCryptoAsset);

      const result = await service.create(createDto);

      expect(repository.save).toHaveBeenCalled();
      const savedAsset = repository.save.mock.calls[0][0] as CryptoAsset;
      expect(savedAsset.symbol).toBe('BTC');
      expect(savedAsset.fullName).toBe('Bitcoin');
      expect(savedAsset.currentPrice).toBe(52000);
    });

    it('should create NFTAsset with all fields', async () => {
      const createDto: CreateAssetDto = {
        type: 'nft',
        amount: 1,
        middlePrice: 10,
        collectionName: 'Bored Ape Yacht Club',
        floorPrice: 15,
        traitPrice: 20,
        nativeToken: 'ETH',
      };

      repository.save.mockResolvedValue(mockNFTAsset);

      const result = await service.create(createDto);

      expect(repository.save).toHaveBeenCalled();
      const savedAsset = repository.save.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.collectionName).toBe('Bored Ape Yacht Club');
      expect(savedAsset.floorPrice).toBe(15);
      expect(savedAsset.traitPrice).toBe(20);
    });

    it('should set nativeToken on NFTAsset (defaults to ETH)', async () => {
      const createDto: CreateAssetDto = {
        type: 'nft',
        amount: 1,
        middlePrice: 10,
        collectionName: 'BAYC',
        floorPrice: 15,
      };

      repository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      await service.create(createDto);

      const savedAsset = repository.save.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.nativeToken).toBe('ETH');
    });

    it('should set custom nativeToken on NFTAsset when provided', async () => {
      const createDto: CreateAssetDto = {
        type: 'nft',
        amount: 1,
        middlePrice: 10,
        collectionName: 'SomeCollection',
        nativeToken: 'SOL',
      };

      repository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      await service.create(createDto);

      const savedAsset = repository.save.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.nativeToken).toBe('SOL');
    });

    it('should calculate middlePriceUsd for NFTAsset using nativeToken price', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test-api-key';
      const createDto: CreateAssetDto = {
        type: 'nft',
        amount: 2,
        middlePrice: 1.5,
        collectionName: 'BAYC',
        nativeToken: 'ETH',
      };

      const mockEthResponse = {
        status: 200, statusText: 'OK', headers: {}, config: {},
        data: {
          data: {
            ETH: { quote: { USD: { price: 2000 } } },
          },
        },
      };
      (httpService.get as jest.Mock).mockReturnValue(of(mockEthResponse as any));
      repository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      await service.create(createDto);

      const savedAsset = repository.save.mock.calls[0][0] as NFTAsset;
      // middlePriceUsd = middlePrice * tokenPrice = 1.5 * 2000 = 3000
      expect(savedAsset.middlePriceUsd).toBeCloseTo(3000, 1);
    });

    it('should set middlePriceUsd to 0 when token price unavailable', async () => {
      delete process.env.COINMARKETCAP_API_KEY;
      const createDto: CreateAssetDto = {
        type: 'nft',
        amount: 1,
        middlePrice: 1.5,
        collectionName: 'BAYC',
        nativeToken: 'ETH',
      };

      repository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      await service.create(createDto);

      const savedAsset = repository.save.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.middlePriceUsd).toBe(0);
    });

    it('should calculate multiple and totalChange when currentPrice is provided for CryptoAsset', async () => {
      const createDto: CreateAssetDto = {
        type: 'crypto',
        amount: 1.5,
        middlePrice: 50000,
        symbol: 'BTC',
        fullName: 'Bitcoin',
        currentPrice: 52000,
      };

      repository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      await service.create(createDto);

      const savedAsset = repository.save.mock.calls[0][0] as CryptoAsset;
      expect(savedAsset.previousPrice).toBe(0);
      expect(savedAsset.dailyChange).toBe(0);
      expect(savedAsset.weeklyChange).toBe(0);
      expect(savedAsset.monthlyChange).toBe(0);
      expect(savedAsset.quartChange).toBe(0);
      expect(savedAsset.yearChange).toBe(0);
      expect(savedAsset.multiple).toBeCloseTo(1.04, 2);
      expect(savedAsset.totalChange).toBeCloseTo(4, 1);
    });

    it('should initialize change fields to 0 for NFTAsset', async () => {
      const createDto: CreateAssetDto = {
        type: 'nft',
        amount: 1,
        middlePrice: 10,
        collectionName: 'BAYC',
        floorPrice: 15,
        traitPrice: 20,
      };

      repository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      await service.create(createDto);

      const savedAsset = repository.save.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.previousPrice).toBe(0);
      // multiple = floorPrice / middlePrice = 15 / 10 = 1.5
      expect(savedAsset.multiple).toBeCloseTo(1.5, 2);
      expect(savedAsset.dailyChange).toBe(0);
    });

    it('should create CryptoAsset without currentPrice - price fetched from API', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test-api-key';
      const createDto: CreateAssetDto = {
        type: 'crypto',
        amount: 1,
        middlePrice: 50000,
        symbol: 'BTC',
        fullName: 'Bitcoin',
      };

      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          data: {
            BTC: {
              quote: {
                USD: {
                  price: 55000,
                },
              },
            },
          },
        },
      };
      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse as any));
      repository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      const result = await service.create(createDto);

      expect(httpService.get).toHaveBeenCalled();
      const savedAsset = repository.save.mock.calls[0][0] as CryptoAsset;
      expect(savedAsset.currentPrice).toBe(55000);
    });

    it('should create CryptoAsset without currentPrice - API unavailable', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test-api-key';
      const createDto: CreateAssetDto = {
        type: 'crypto',
        amount: 1,
        middlePrice: 50000,
        symbol: 'ETH',
        fullName: 'Ethereum',
      };

      (httpService.get as jest.Mock).mockImplementation(() =>
        throwError(() => new Error('Network error')),
      );
      repository.save.mockImplementation((asset) => Promise.resolve(asset as Asset));

      const result = await service.create(createDto);

      const savedAsset = repository.save.mock.calls[0][0] as CryptoAsset;
      expect(savedAsset.currentPrice).toBe(0);
    });
  });

  describe('update', () => {
    it('should update existing asset', async () => {
      const updateDto = { amount: 2.0 };
      const updatedAsset = { ...mockCryptoAsset, amount: 2.0 };

      repository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      repository.findOneBy.mockResolvedValue(updatedAsset);

      const result = await service.update(1, updateDto as any);

      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result?.amount).toBe(2.0);
    });

    it('should return null if asset not found', async () => {
      const updateDto = { amount: 2.0 };

      repository.update.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.update(999, updateDto as any);

      expect(result).toBeNull();
    });

    it('should update multiple fields', async () => {
      const updateDto = { 
        amount: 3.0, 
        middlePrice: 55000 
      };
      const updatedAsset = { 
        ...mockCryptoAsset, 
        amount: 3.0, 
        middlePrice: 55000 
      };

      repository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });
      repository.findOneBy.mockResolvedValue(updatedAsset);

      const result = await service.update(1, updateDto as any);

      expect(result?.amount).toBe(3.0);
      expect(result?.middlePrice).toBe(55000);
    });
  });

  describe('remove', () => {
    it('should delete asset by id', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(1);

      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should not throw error if asset not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.remove(999)).resolves.not.toThrow();
    });
  });

  describe('refreshNFTs', () => {
    let userSettingsService: jest.Mocked<{ getUserSettings: jest.Mock }>;
    let assetUpdateService: jest.Mocked<{ updateNFTAsset: jest.Mock }>;

    beforeEach(() => {
      userSettingsService = (service as any).userSettingsService;
      assetUpdateService = (service as any).assetUpdateService;
    });

    it('should pass openseaApiKey to updateNFTAsset', async () => {
      userSettingsService.getUserSettings.mockResolvedValue({ openseaApiKey: 'user-opensea-key' } as any);
      repository.find.mockResolvedValue([mockNFTAsset]);
      assetUpdateService.updateNFTAsset.mockResolvedValue(undefined);

      await service.refreshNFTs(1);

      expect(assetUpdateService.updateNFTAsset).toHaveBeenCalledWith(
        mockNFTAsset,
        'user-opensea-key',
      );
    });

    it('should pass undefined when openseaApiKey not set', async () => {
      userSettingsService.getUserSettings.mockResolvedValue(null as any);
      repository.find.mockResolvedValue([mockNFTAsset]);
      assetUpdateService.updateNFTAsset.mockResolvedValue(undefined);

      await service.refreshNFTs(1);

      expect(assetUpdateService.updateNFTAsset).toHaveBeenCalledWith(
        mockNFTAsset,
        undefined,
      );
    });

    it('should return updated nft assets after refresh', async () => {
      userSettingsService.getUserSettings.mockResolvedValue({ openseaApiKey: 'key' } as any);
      repository.find
        .mockResolvedValueOnce([mockNFTAsset]) // first call: get nfts to update
        .mockResolvedValueOnce([mockNFTAsset]); // second call: return updated list
      assetUpdateService.updateNFTAsset.mockResolvedValue(undefined);

      const result = await service.refreshNFTs(1);

      expect(result).toEqual([mockNFTAsset]);
    });
  });

  describe('getCryptoPrice', () => {
    const mockPrice = 52000;

    it('should return price when API call is successful', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test-api-key';
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          data: {
            BTC: {
              quote: {
                USD: {
                  price: mockPrice,
                },
              },
            },
          },
        },
      };
      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse as any));

      const result = await service.getCryptoPrice('BTC');

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toBe(mockPrice);
    });

    it('should return null when API returns null data', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test-api-key';
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: {
          data: null,
        },
      };
      (httpService.get as jest.Mock).mockImplementation(() => of(mockResponse as any));

      const result = await service.getCryptoPrice('INVALID');

      expect(result).toBeNull();
    });

    it('should return null when API key is not set', async () => {
      const originalKey = process.env.COINMARKETCAP_API_KEY;
      delete process.env.COINMARKETCAP_API_KEY;

      const result = await service.getCryptoPrice('BTC');

      expect(result).toBeNull();
      expect(httpService.get).not.toHaveBeenCalled();

      if (originalKey) {
        process.env.COINMARKETCAP_API_KEY = originalKey;
      }
    });

    it('should return null when API throws error', async () => {
      process.env.COINMARKETCAP_API_KEY = 'test-api-key';
      (httpService.get as jest.Mock).mockImplementation(() =>
        throwError(() => new Error('Network error')),
      );

      const result = await service.getCryptoPrice('BTC');

      expect(result).toBeNull();
    });
  });
});
