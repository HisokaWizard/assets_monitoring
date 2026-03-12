import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HistoricalPrice } from "./historical-price.entity";
import { HistoricalPriceRepository } from "./historical-price.repository";

describe("HistoricalPriceRepository", () => {
  let historicalPriceRepository: HistoricalPriceRepository;
  let typeormRepository: jest.Mocked<Repository<HistoricalPrice>>;

  const mockTimestamp = new Date("2026-03-10T12:00:00.000Z");

  const mockHistoricalPrice: HistoricalPrice = {
    id: 1,
    assetId: 1,
    price: 52000,
    timestamp: mockTimestamp,
    source: "CoinMarketCap",
  } as HistoricalPrice;

  const mockHistoricalPrices: HistoricalPrice[] = [
    {
      id: 3,
      assetId: 1,
      price: 54000,
      timestamp: new Date("2026-03-10T18:00:00.000Z"),
      source: "CoinMarketCap",
    } as HistoricalPrice,
    {
      id: 2,
      assetId: 1,
      price: 53000,
      timestamp: new Date("2026-03-10T14:00:00.000Z"),
      source: "CoinMarketCap",
    } as HistoricalPrice,
    {
      id: 1,
      assetId: 1,
      price: 52000,
      timestamp: new Date("2026-03-10T10:00:00.000Z"),
      source: "CoinMarketCap",
    } as HistoricalPrice,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricalPriceRepository,
        {
          provide: getRepositoryToken(HistoricalPrice),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    historicalPriceRepository = module.get<HistoricalPriceRepository>(
      HistoricalPriceRepository,
    );
    typeormRepository = module.get(getRepositoryToken(HistoricalPrice));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("savePrice", () => {
    it("should create and save historical price record", async () => {
      // Arrange
      const priceData = {
        assetId: 1,
        price: 52000,
        timestamp: mockTimestamp,
        source: "CoinMarketCap",
      };
      typeormRepository.create.mockReturnValue(mockHistoricalPrice);
      typeormRepository.save.mockResolvedValue(mockHistoricalPrice);

      // Act
      const result = await historicalPriceRepository.savePrice(priceData);

      // Assert
      expect(typeormRepository.create).toHaveBeenCalledWith(priceData);
      expect(typeormRepository.save).toHaveBeenCalledWith(mockHistoricalPrice);
      expect(result).toEqual(mockHistoricalPrice);
      expect(result.assetId).toBe(1);
      expect(result.price).toBe(52000);
    });

    it("should set correct timestamp and source", async () => {
      // Arrange
      const customTimestamp = new Date("2026-03-11T08:30:00.000Z");
      const priceData = {
        assetId: 2,
        price: 9800,
        timestamp: customTimestamp,
        source: "OpenSea",
      };
      const expectedRecord = {
        id: 2,
        assetId: 2,
        price: 9800,
        timestamp: customTimestamp,
        source: "OpenSea",
      } as HistoricalPrice;

      typeormRepository.create.mockReturnValue(expectedRecord);
      typeormRepository.save.mockResolvedValue(expectedRecord);

      // Act
      const result = await historicalPriceRepository.savePrice(priceData);

      // Assert
      expect(typeormRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: customTimestamp,
          source: "OpenSea",
        }),
      );
      expect(result.timestamp).toEqual(customTimestamp);
      expect(result.source).toBe("OpenSea");
    });
  });

  describe("findByAssetIdDesc", () => {
    it("should return prices ordered by timestamp DESC", async () => {
      // Arrange
      typeormRepository.find.mockResolvedValue(mockHistoricalPrices);

      // Act
      const result = await historicalPriceRepository.findByAssetIdDesc(1, 400);

      // Assert
      expect(typeormRepository.find).toHaveBeenCalledWith({
        where: { assetId: 1 },
        order: { timestamp: "DESC" },
        take: 400,
      });
      expect(result).toHaveLength(3);
      // Verify DESC order: newest first
      expect(result[0].price).toBe(54000);
      expect(result[1].price).toBe(53000);
      expect(result[2].price).toBe(52000);
    });

    it("should limit results to specified take value", async () => {
      // Arrange
      const limitedPrices = mockHistoricalPrices.slice(0, 2);
      typeormRepository.find.mockResolvedValue(limitedPrices);

      // Act
      const result = await historicalPriceRepository.findByAssetIdDesc(1, 2);

      // Assert
      expect(typeormRepository.find).toHaveBeenCalledWith({
        where: { assetId: 1 },
        order: { timestamp: "DESC" },
        take: 2,
      });
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no history", async () => {
      // Arrange
      typeormRepository.find.mockResolvedValue([]);

      // Act
      const result = await historicalPriceRepository.findByAssetIdDesc(
        999,
        400,
      );

      // Assert
      expect(typeormRepository.find).toHaveBeenCalledWith({
        where: { assetId: 999 },
        order: { timestamp: "DESC" },
        take: 400,
      });
      expect(result).toEqual([]);
    });
  });
});
