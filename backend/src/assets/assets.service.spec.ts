import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { Asset, CryptoAsset, NFTAsset } from './asset.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAssetDto } from './dto/create-asset.dto';

describe('AssetsService', () => {
  let service: AssetsService;
  let repository: jest.Mocked<Repository<Asset>>;

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
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    repository = module.get(getRepositoryToken(Asset));
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
      };

      repository.save.mockResolvedValue(mockNFTAsset);

      const result = await service.create(createDto);

      expect(repository.save).toHaveBeenCalled();
      const savedAsset = repository.save.mock.calls[0][0] as NFTAsset;
      expect(savedAsset.collectionName).toBe('Bored Ape Yacht Club');
      expect(savedAsset.floorPrice).toBe(15);
      expect(savedAsset.traitPrice).toBe(20);
    });

    it('should initialize change fields to 0 for CryptoAsset', async () => {
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
      expect(savedAsset.multiple).toBe(0);
      expect(savedAsset.dailyChange).toBe(0);
      expect(savedAsset.weeklyChange).toBe(0);
      expect(savedAsset.monthlyChange).toBe(0);
      expect(savedAsset.quartChange).toBe(0);
      expect(savedAsset.yearChange).toBe(0);
      expect(savedAsset.totalChange).toBe(0);
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
      expect(savedAsset.multiple).toBe(0);
      expect(savedAsset.dailyChange).toBe(0);
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
});
