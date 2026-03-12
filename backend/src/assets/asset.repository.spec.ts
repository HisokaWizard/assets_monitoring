import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { Asset, CryptoAsset, NFTAsset } from "./asset.entity";
import { AssetRepository } from "./asset.repository";

describe("AssetRepository", () => {
  let assetRepository: AssetRepository;
  let typeormRepository: jest.Mocked<Repository<Asset>>;

  const mockCryptoAsset = {
    id: 1,
    type: "crypto" as const,
    amount: 1.5,
    middlePrice: 50000,
    previousPrice: 0,
    multiple: 1.04,
    dailyChange: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    quartChange: 0,
    yearChange: 0,
    totalChange: 4,
    userId: 1,
    symbol: "BTC",
    fullName: "Bitcoin",
    currentPrice: 52000,
  } as unknown as CryptoAsset;

  const mockNFTAsset = {
    id: 2,
    type: "nft" as const,
    amount: 1,
    middlePrice: 10,
    previousPrice: 0,
    multiple: 1.5,
    dailyChange: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    quartChange: 0,
    yearChange: 0,
    totalChange: 50,
    userId: 1,
    collectionName: "Bored Ape Yacht Club",
    nativeToken: "ETH",
    floorPrice: 15,
    floorPriceUsd: 42000,
    middlePriceUsd: 28000,
    traitPrice: 20,
  } as unknown as NFTAsset;

  const mockAssetForUser2 = {
    id: 3,
    type: "crypto" as const,
    amount: 10,
    middlePrice: 2000,
    previousPrice: 0,
    multiple: 1.1,
    dailyChange: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    quartChange: 0,
    yearChange: 0,
    totalChange: 10,
    userId: 2,
    symbol: "ETH",
    fullName: "Ethereum",
    currentPrice: 2200,
  } as unknown as CryptoAsset;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetRepository,
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
      ],
    }).compile();

    assetRepository = module.get<AssetRepository>(AssetRepository);
    typeormRepository = module.get(getRepositoryToken(Asset));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all assets", async () => {
      // Arrange
      typeormRepository.find.mockResolvedValue([mockCryptoAsset, mockNFTAsset]);

      // Act
      const result = await assetRepository.findAll();

      // Assert
      expect(typeormRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockCryptoAsset, mockNFTAsset]);
    });

    it("should return empty array when no assets", async () => {
      // Arrange
      typeormRepository.find.mockResolvedValue([]);

      // Act
      const result = await assetRepository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("findOneById", () => {
    it("should return asset when found", async () => {
      // Arrange
      typeormRepository.findOneBy.mockResolvedValue(mockCryptoAsset);

      // Act
      const result = await assetRepository.findOneById(1);

      // Assert
      expect(typeormRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockCryptoAsset);
    });

    it("should return null when not found", async () => {
      // Arrange
      typeormRepository.findOneBy.mockResolvedValue(null);

      // Act
      const result = await assetRepository.findOneById(999);

      // Assert
      expect(typeormRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(result).toBeNull();
    });
  });

  describe("saveAsset", () => {
    it("should save and return the asset", async () => {
      // Arrange
      typeormRepository.save.mockResolvedValue(mockCryptoAsset);

      // Act
      const result = await assetRepository.saveAsset(mockCryptoAsset);

      // Assert
      expect(typeormRepository.save).toHaveBeenCalledWith(mockCryptoAsset);
      expect(result).toEqual(mockCryptoAsset);
    });
  });

  describe("updateById", () => {
    it("should call update with correct id and data", async () => {
      // Arrange
      const updateData: Partial<Asset> = { amount: 2.0, middlePrice: 55000 };
      typeormRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      // Act
      await assetRepository.updateById(1, updateData);

      // Assert
      expect(typeormRepository.update).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe("deleteById", () => {
    it("should call delete with correct id", async () => {
      // Arrange
      typeormRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      // Act
      await assetRepository.deleteById(1);

      // Assert
      expect(typeormRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe("findByUserId", () => {
    it("should return assets for given userId", async () => {
      // Arrange
      typeormRepository.find.mockResolvedValue([mockCryptoAsset, mockNFTAsset]);

      // Act
      const result = await assetRepository.findByUserId(1);

      // Assert
      expect(typeormRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockCryptoAsset, mockNFTAsset]);
    });

    it("should return empty array when user has no assets", async () => {
      // Arrange
      typeormRepository.find.mockResolvedValue([]);

      // Act
      const result = await assetRepository.findByUserId(999);

      // Assert
      expect(typeormRepository.find).toHaveBeenCalledWith({
        where: { userId: 999 },
      });
      expect(result).toEqual([]);
    });
  });

  describe("findByUserIdAndType", () => {
    it("should return assets filtered by userId and type", async () => {
      // Arrange
      typeormRepository.find.mockResolvedValue([mockNFTAsset]);

      // Act
      const result = await assetRepository.findByUserIdAndType(1, "nft");

      // Assert
      expect(typeormRepository.find).toHaveBeenCalledWith({
        where: { userId: 1, type: "nft" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockNFTAsset);
    });

    it("should return empty array when no matching assets", async () => {
      // Arrange
      typeormRepository.find.mockResolvedValue([]);

      // Act
      const result = await assetRepository.findByUserIdAndType(1, "crypto");

      // Assert
      expect(typeormRepository.find).toHaveBeenCalledWith({
        where: { userId: 1, type: "crypto" },
      });
      expect(result).toEqual([]);
    });
  });

  describe("saveMany", () => {
    it("should save multiple assets at once", async () => {
      // Arrange
      const assets = [mockCryptoAsset, mockNFTAsset, mockAssetForUser2];
      typeormRepository.save.mockResolvedValue(assets as any);

      // Act
      const result = await assetRepository.saveMany(assets as any);

      // Assert
      expect(typeormRepository.save).toHaveBeenCalledWith(assets);
      expect(result).toHaveLength(3);
    });
  });
});
