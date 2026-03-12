import { Test, TestingModule } from "@nestjs/testing";
import { AssetsService } from "./assets.service";
import { Asset, CryptoAsset, NFTAsset } from "./asset.entity";
import { AssetRepository } from "./asset.repository";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { AssetUpdateService } from "./asset-update.service";
import { UserSettingsService } from "../user-settings/user-settings.service";

describe("AssetsService", () => {
  let service: AssetsService;
  let assetRepository: jest.Mocked<AssetRepository>;
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
    symbol: "BTC",
    fullName: "Bitcoin",
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
    collectionName: "Bored Ape Yacht Club",
    floorPrice: 15,
    floorPriceUsd: 42000,
    middlePriceUsd: 28000,
    nativeToken: "ETH",
    traitPrice: 20,
  } as unknown as NFTAsset;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: AssetRepository,
          useValue: {
            findAll: jest.fn(),
            findOneById: jest.fn(),
            saveAsset: jest.fn(),
            updateById: jest.fn(),
            deleteById: jest.fn(),
            findByUserId: jest.fn(),
            findByUserIdAndType: jest.fn(),
            saveMany: jest.fn(),
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
            fetchFromOpenSea: jest.fn().mockResolvedValue({
              floorPrice: null,
              floorPriceUsd: null,
              floorPriceSymbol: null,
            }),
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
    assetRepository = module.get(AssetRepository);
    httpService = module.get(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return an array of assets", async () => {
      assetRepository.findAll.mockResolvedValue([
        mockCryptoAsset,
        mockNFTAsset,
      ]);

      const result = await service.findAll();

      expect(assetRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect((result[0] as CryptoAsset).symbol).toBe("BTC");
      expect((result[1] as NFTAsset).collectionName).toBe(
        "Bored Ape Yacht Club",
      );
    });

    it("should work with empty array", async () => {
      assetRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it("should return mixed types", async () => {
      assetRepository.findAll.mockResolvedValue([
        mockCryptoAsset,
        mockNFTAsset,
        mockCryptoAsset,
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect((result[0] as CryptoAsset).symbol).toBeDefined();
      expect((result[1] as NFTAsset).collectionName).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should return asset by id", async () => {
      assetRepository.findOneById.mockResolvedValue(mockCryptoAsset);

      const result = await service.findOne(1);

      expect(assetRepository.findOneById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCryptoAsset);
    });

    it("should return null if not found", async () => {
      assetRepository.findOneById.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it("should work with CryptoAsset", async () => {
      assetRepository.findOneById.mockResolvedValue(mockCryptoAsset);

      const result = await service.findOne(1);

      expect((result as CryptoAsset)?.symbol).toBe("BTC");
    });

    it("should work with NFTAsset", async () => {
      assetRepository.findOneById.mockResolvedValue(mockNFTAsset);

      const result = await service.findOne(2);

      expect((result as NFTAsset)?.collectionName).toBe("Bored Ape Yacht Club");
    });
  });

  describe("create", () => {
    it("should create CryptoAsset with all fields", async () => {
      const createDto: CreateAssetDto = {
        type: "crypto",
        amount: 1.5,
        middlePrice: 50000,
        symbol: "BTC",
        fullName: "Bitcoin",
        currentPrice: 52000,
      };

      assetRepository.saveAsset.mockResolvedValue(mockCryptoAsset);

      const result = await service.create(createDto);

      expect(assetRepository.saveAsset).toHaveBeenCalled();
      const savedAsset = assetRepository.saveAsset.mock
        .calls[0][0] as CryptoAsset;
      expect(savedAsset.symbol).toBe("BTC");
      expect(savedAsset.fullName).toBe("Bitcoin");
      expect(savedAsset.currentPrice).toBe(52000);
    });

    it("should create NFTAsset with all fields and fetch floor from OpenSea", async () => {
      const createDto: CreateAssetDto = {
        type: "nft",
        amount: 1,
        middlePrice: 10,
        collectionName: "Bored Ape Yacht Club",
        traitPrice: 20,
        nativeToken: "ETH",
      };

      // OpenSea вернёт floorPrice
      const assetUpdateService = (service as any).assetUpdateService;
      assetUpdateService.fetchFromOpenSea.mockResolvedValue({
        floorPrice: 15,
        floorPriceUsd: 42000,
        floorPriceSymbol: "ETH",
      });

      assetRepository.saveAsset.mockResolvedValue(mockNFTAsset);

      await service.create(createDto);

      expect(assetRepository.saveAsset).toHaveBeenCalled();
      const savedAsset = assetRepository.saveAsset.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.collectionName).toBe("Bored Ape Yacht Club");
      expect(savedAsset.floorPrice).toBe(15);
      expect(savedAsset.floorPriceUsd).toBe(42000);
      expect(savedAsset.traitPrice).toBe(20);
    });

    it("should use floorPrice from OpenSea (ignores dto floorPrice when opensea responds)", async () => {
      const createDto: CreateAssetDto = {
        type: "nft",
        amount: 1,
        middlePrice: 10,
        collectionName: "BAYC",
      };

      const assetUpdateService = (service as any).assetUpdateService;
      assetUpdateService.fetchFromOpenSea.mockResolvedValue({
        floorPrice: 20,
        floorPriceUsd: 56000,
        floorPriceSymbol: "ETH",
      });

      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      await service.create(createDto);

      const savedAsset = assetRepository.saveAsset.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.floorPrice).toBe(20);
      expect(savedAsset.floorPriceUsd).toBe(56000);
      // nativeToken берётся из OpenSea
      expect(savedAsset.nativeToken).toBe("ETH");
    });

    it("should use nativeToken from dto when OpenSea has no data", async () => {
      const createDto: CreateAssetDto = {
        type: "nft",
        amount: 1,
        middlePrice: 10,
        collectionName: "SomeCollection",
        nativeToken: "SOL",
      };

      const assetUpdateService = (service as any).assetUpdateService;
      assetUpdateService.fetchFromOpenSea.mockResolvedValue({
        floorPrice: null,
        floorPriceUsd: null,
        floorPriceSymbol: null,
      });

      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      await service.create(createDto);

      const savedAsset = assetRepository.saveAsset.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.nativeToken).toBe("SOL");
    });

    it("should default nativeToken to ETH when OpenSea has no data and dto has no nativeToken", async () => {
      const createDto: CreateAssetDto = {
        type: "nft",
        amount: 1,
        middlePrice: 10,
        collectionName: "BAYC",
      };

      const assetUpdateService = (service as any).assetUpdateService;
      assetUpdateService.fetchFromOpenSea.mockResolvedValue({
        floorPrice: null,
        floorPriceUsd: null,
        floorPriceSymbol: null,
      });

      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      await service.create(createDto);

      const savedAsset = assetRepository.saveAsset.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.nativeToken).toBe("ETH");
    });

    it("should calculate middlePriceUsd for NFTAsset using nativeToken price", async () => {
      const createDto: CreateAssetDto & { userId?: number } = {
        type: "nft",
        amount: 2,
        middlePrice: 1.5,
        collectionName: "BAYC",
        nativeToken: "ETH",
        userId: 1,
      };

      const userSettingsService = (service as any).userSettingsService;
      userSettingsService.getUserSettings.mockResolvedValue({
        coinmarketcapApiKey: "test-cmc-key",
        openseaApiKey: "test-opensea-key",
      } as any);

      const assetUpdateService = (service as any).assetUpdateService;
      assetUpdateService.fetchFromOpenSea.mockResolvedValue({
        floorPrice: 2.0,
        floorPriceUsd: 5600,
        floorPriceSymbol: "ETH",
      });

      const mockEthResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
        data: { data: { ETH: { quote: { USD: { price: 2000 } } } } },
      };
      (httpService.get as jest.Mock).mockReturnValue(
        of(mockEthResponse as any),
      );
      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      await service.create(createDto);

      const savedAsset = assetRepository.saveAsset.mock.calls[0][0] as NFTAsset;
      // middlePriceUsd = middlePrice * tokenPrice = 1.5 * 2000 = 3000
      expect(savedAsset.middlePriceUsd).toBeCloseTo(3000, 1);
    });

    it("should set middlePriceUsd to 0 when token price unavailable", async () => {
      const createDto: CreateAssetDto = {
        type: "nft",
        amount: 1,
        middlePrice: 1.5,
        collectionName: "BAYC",
        nativeToken: "ETH",
      };

      const assetUpdateService = (service as any).assetUpdateService;
      assetUpdateService.fetchFromOpenSea.mockResolvedValue({
        floorPrice: null,
        floorPriceUsd: null,
        floorPriceSymbol: null,
      });

      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      await service.create(createDto);

      const savedAsset = assetRepository.saveAsset.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.middlePriceUsd).toBe(0);
    });

    it("should calculate multiple and totalChange when currentPrice is provided for CryptoAsset", async () => {
      const createDto: CreateAssetDto = {
        type: "crypto",
        amount: 1.5,
        middlePrice: 50000,
        symbol: "BTC",
        fullName: "Bitcoin",
        currentPrice: 52000,
      };

      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      await service.create(createDto);

      const savedAsset = assetRepository.saveAsset.mock
        .calls[0][0] as CryptoAsset;
      expect(savedAsset.previousPrice).toBe(0);
      expect(savedAsset.dailyChange).toBe(0);
      expect(savedAsset.weeklyChange).toBe(0);
      expect(savedAsset.monthlyChange).toBe(0);
      expect(savedAsset.quartChange).toBe(0);
      expect(savedAsset.yearChange).toBe(0);
      expect(savedAsset.multiple).toBeCloseTo(1.04, 2);
      expect(savedAsset.totalChange).toBeCloseTo(4, 1);
    });

    it("should initialize change fields to 0 for NFTAsset and use OpenSea floorPrice", async () => {
      const createDto: CreateAssetDto = {
        type: "nft",
        amount: 1,
        middlePrice: 10,
        collectionName: "BAYC",
        traitPrice: 20,
      };

      const assetUpdateService = (service as any).assetUpdateService;
      assetUpdateService.fetchFromOpenSea.mockResolvedValue({
        floorPrice: 15,
        floorPriceUsd: 42000,
        floorPriceSymbol: "ETH",
      });

      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      await service.create(createDto);

      const savedAsset = assetRepository.saveAsset.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.previousPrice).toBe(0);
      // multiple = floorPrice / middlePrice = 15 / 10 = 1.5
      expect(savedAsset.multiple).toBeCloseTo(1.5, 2);
      expect(savedAsset.dailyChange).toBe(0);
    });

    it("should create CryptoAsset without currentPrice - price fetched from API", async () => {
      const createDto: CreateAssetDto & { userId?: number } = {
        type: "crypto",
        amount: 1,
        middlePrice: 50000,
        symbol: "BTC",
        fullName: "Bitcoin",
        userId: 1,
      };

      const userSettingsService = (service as any).userSettingsService;
      userSettingsService.getUserSettings.mockResolvedValue({
        coinmarketcapApiKey: "test-cmc-key",
        openseaApiKey: null,
      } as any);

      const mockResponse = {
        status: 200,
        statusText: "OK",
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
      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      const result = await service.create(createDto);

      expect(httpService.get).toHaveBeenCalled();
      const savedAsset = assetRepository.saveAsset.mock
        .calls[0][0] as CryptoAsset;
      expect(savedAsset.currentPrice).toBe(55000);
    });

    it("should create CryptoAsset without currentPrice - API unavailable", async () => {
      const userSettingsService = (service as any).userSettingsService;
      userSettingsService.getUserSettings.mockResolvedValue({
        coinmarketcapApiKey: "test-cmc-key",
      } as any);
      const createDto: CreateAssetDto = {
        type: "crypto",
        amount: 1,
        middlePrice: 50000,
        symbol: "ETH",
        fullName: "Ethereum",
      };

      (httpService.get as jest.Mock).mockImplementation(() =>
        throwError(() => new Error("Network error")),
      );
      assetRepository.saveAsset.mockImplementation((asset: Asset) =>
        Promise.resolve(asset as Asset),
      );

      const result = await service.create(createDto);

      const savedAsset = assetRepository.saveAsset.mock
        .calls[0][0] as CryptoAsset;
      expect(savedAsset.currentPrice).toBe(0);
    });
  });

  describe("update", () => {
    it("should update existing asset", async () => {
      const updateDto = { amount: 2.0 };
      const updatedAsset = { ...mockCryptoAsset, amount: 2.0 };

      assetRepository.updateById.mockResolvedValue(undefined);
      assetRepository.findOneById.mockResolvedValue(updatedAsset);

      const result = await service.update(1, updateDto as any);

      expect(assetRepository.updateById).toHaveBeenCalledWith(1, updateDto);
      expect(result?.amount).toBe(2.0);
    });

    it("should return null if asset not found", async () => {
      const updateDto = { amount: 2.0 };

      assetRepository.updateById.mockResolvedValue(undefined);
      assetRepository.findOneById.mockResolvedValue(null);

      const result = await service.update(999, updateDto as any);

      expect(result).toBeNull();
    });

    it("should update multiple fields", async () => {
      const updateDto = {
        amount: 3.0,
        middlePrice: 55000,
      };
      const updatedAsset = {
        ...mockCryptoAsset,
        amount: 3.0,
        middlePrice: 55000,
      };

      assetRepository.updateById.mockResolvedValue(undefined);
      assetRepository.findOneById.mockResolvedValue(updatedAsset);

      const result = await service.update(1, updateDto as any);

      expect(result?.amount).toBe(3.0);
      expect(result?.middlePrice).toBe(55000);
    });
  });

  describe("remove", () => {
    it("should delete asset by id", async () => {
      assetRepository.deleteById.mockResolvedValue(undefined);

      await service.remove(1);

      expect(assetRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it("should not throw error if asset not found", async () => {
      assetRepository.deleteById.mockResolvedValue(undefined);

      await expect(service.remove(999)).resolves.not.toThrow();
    });
  });

  describe("refreshNFTs", () => {
    let userSettingsService: jest.Mocked<{ getUserSettings: jest.Mock }>;
    let assetUpdateService: jest.Mocked<{ updateNFTAsset: jest.Mock }>;

    beforeEach(() => {
      userSettingsService = (service as any).userSettingsService;
      assetUpdateService = (service as any).assetUpdateService;
    });

    it("should pass openseaApiKey and coinmarketcapApiKey to updateNFTAsset", async () => {
      userSettingsService.getUserSettings.mockResolvedValue({
        openseaApiKey: "user-opensea-key",
        coinmarketcapApiKey: "user-cmc-key",
      } as any);
      assetRepository.findByUserIdAndType.mockResolvedValue([mockNFTAsset]);
      assetRepository.findByUserIdAndType.mockResolvedValue([mockNFTAsset]);
      assetUpdateService.updateNFTAsset.mockResolvedValue(undefined);

      await service.refreshNFTs(1);

      expect(assetUpdateService.updateNFTAsset).toHaveBeenCalledWith(
        mockNFTAsset,
        "user-opensea-key",
        "user-cmc-key",
      );
    });

    it("should pass undefined when api keys not set", async () => {
      userSettingsService.getUserSettings.mockResolvedValue(null as any);
      assetRepository.findByUserIdAndType.mockResolvedValue([mockNFTAsset]);
      assetUpdateService.updateNFTAsset.mockResolvedValue(undefined);

      await service.refreshNFTs(1);

      expect(assetUpdateService.updateNFTAsset).toHaveBeenCalledWith(
        mockNFTAsset,
        undefined,
        undefined,
      );
    });

    it("should return updated nft assets after refresh", async () => {
      userSettingsService.getUserSettings.mockResolvedValue({
        openseaApiKey: "key",
      } as any);
      assetRepository.findByUserIdAndType
        .mockResolvedValueOnce([mockNFTAsset]) // first call: get nfts to update
        .mockResolvedValueOnce([mockNFTAsset]); // second call: return updated list
      assetUpdateService.updateNFTAsset.mockResolvedValue(undefined);

      const result = await service.refreshNFTs(1);

      expect(result).toEqual([mockNFTAsset]);
    });
  });

  describe("getCryptoPrice", () => {
    const mockPrice = 52000;

    it("should return price when API call is successful", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
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

      const result = await service.getCryptoPrice("BTC", "test-api-key");

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toBe(mockPrice);
    });

    it("should return null when API returns null data", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
        data: {
          data: null,
        },
      };
      (httpService.get as jest.Mock).mockImplementation(() =>
        of(mockResponse as any),
      );

      const result = await service.getCryptoPrice("INVALID", "test-api-key");

      expect(result).toBeNull();
    });

    it("should return null when API key is not provided", async () => {
      const result = await service.getCryptoPrice("BTC");

      expect(result).toBeNull();
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it("should return null when API throws error", async () => {
      (httpService.get as jest.Mock).mockImplementation(() =>
        throwError(() => new Error("Network error")),
      );

      const result = await service.getCryptoPrice("BTC", "test-api-key");

      expect(result).toBeNull();
    });
  });
});
