import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetsService } from './assets.service';
import { Asset, CryptoAsset, NFTAsset } from './asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

describe('AssetsService', () => {
  let service: AssetsService;
  let assetsRepository: jest.Mocked<Repository<Asset>>;

  const mockAsset: Asset = {
    id: 1,
    amount: 1.5,
    middlePrice: 50000,
    previousPrice: 45000,
    multiple: 1.11,
    dailyChange: 5,
    weeklyChange: 10,
    monthlyChange: 15,
    quartChange: 20,
    yearChange: 25,
    totalChange: 30,
    dailyPrice: undefined,
    dailyTimestamp: undefined,
    weeklyPrice: undefined,
    weeklyTimestamp: undefined,
    monthlyPrice: undefined,
    monthlyTimestamp: undefined,
    quartPrice: undefined,
    quartTimestamp: undefined,
    yearPrice: undefined,
    yearTimestamp: undefined,
    userId: 1,
    user: {} as any,
  };

  beforeEach(async () => {
    const mockAssetsRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetsRepository,
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    assetsRepository = module.get(getRepositoryToken(Asset));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all assets for user', async () => {
      const mockAssets = [mockAsset, { ...mockAsset, id: 2 }];
      assetsRepository.find.mockResolvedValue(mockAssets);

      const result = await service.findAll();

      expect(assetsRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockAssets);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no assets', async () => {
      assetsRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return asset by ID', async () => {
      assetsRepository.findOneBy.mockResolvedValue(mockAsset);

      const result = await service.findOne(1);

      expect(assetsRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockAsset);
    });

    it('should return null when asset not found', async () => {
      assetsRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a crypto asset', async () => {
      const createAssetDto: CreateAssetDto = {
        type: 'crypto',
        amount: 0.5,
        middlePrice: 50000,
        symbol: 'BTC',
        fullName: 'Bitcoin',
        currentPrice: 55000,
      };

      const savedCryptoAsset = {
        ...mockAsset,
        id: 1,
        type: 'crypto',
        symbol: 'BTC',
        fullName: 'Bitcoin',
        currentPrice: 55000,
      } as CryptoAsset;

      assetsRepository.save.mockResolvedValue(savedCryptoAsset);

      const result = await service.create(createAssetDto);

      expect(assetsRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect((result as CryptoAsset).symbol).toBe('BTC');
    });

    it('should create an NFT asset', async () => {
      const createAssetDto: CreateAssetDto = {
        type: 'nft',
        amount: 1,
        middlePrice: 2000,
        collectionName: 'Bored Ape Yacht Club',
        floorPrice: 1800,
        traitPrice: 500,
      };

      const savedNFTAsset = {
        ...mockAsset,
        id: 2,
        type: 'nft',
        collectionName: 'Bored Ape Yacht Club',
        floorPrice: 1800,
        traitPrice: 500,
      } as NFTAsset;

      assetsRepository.save.mockResolvedValue(savedNFTAsset);

      const result = await service.create(createAssetDto);

      expect(assetsRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect((result as NFTAsset).collectionName).toBe('Bored Ape Yacht Club');
    });
  });

  describe('update', () => {
    it('should update an asset', async () => {
      const updateAssetDto = {
        amount: 2.0,
        middlePrice: 60000,
      } as unknown as UpdateAssetDto;

      const updatedAsset = { ...mockAsset, ...updateAssetDto };
      assetsRepository.update.mockResolvedValue({ affected: 1 } as any);
      assetsRepository.findOneBy.mockResolvedValue(updatedAsset);

      const result = await service.update(1, updateAssetDto);

      expect(assetsRepository.update).toHaveBeenCalledWith(1, updateAssetDto);
      expect(assetsRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(updatedAsset);
    });

    it('should return null when updating non-existent asset', async () => {
      const updateAssetDto = {
        amount: 2.0,
      } as unknown as UpdateAssetDto;

      assetsRepository.update.mockResolvedValue({ affected: 0 } as any);
      assetsRepository.findOneBy.mockResolvedValue(null);

      const result = await service.update(999, updateAssetDto);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete an asset', async () => {
      assetsRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1);

      expect(assetsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should not throw when deleting non-existent asset', async () => {
      assetsRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove(999)).resolves.not.toThrow();
    });
  });
});
