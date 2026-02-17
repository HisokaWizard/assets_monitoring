import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { CryptoAsset, NFTAsset } from './asset.entity';

describe('AssetsController', () => {
  let controller: AssetsController;
  let service: jest.Mocked<AssetsService>;

  const mockCryptoAsset = {
    id: 1,
    amount: 1.5,
    middlePrice: 50000,
    symbol: 'BTC',
    fullName: 'Bitcoin',
    currentPrice: 52000,
  } as unknown as CryptoAsset;

  const mockNFTAsset = {
    id: 2,
    amount: 1,
    middlePrice: 10,
    collectionName: 'Bored Ape Yacht Club',
    floorPrice: 15,
    traitPrice: 20,
  } as unknown as NFTAsset;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
    service = module.get(AssetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return 200 and array of assets', async () => {
      service.findAll.mockResolvedValue([mockCryptoAsset, mockNFTAsset]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should work with empty array', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('should call service.findAll()', async () => {
      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return 200 and asset by id', async () => {
      service.findOne.mockResolvedValue(mockCryptoAsset);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCryptoAsset);
    });

    it('should throw NotFoundException if not found', async () => {
      service.findOne.mockResolvedValue(null);

      await expect(controller.findOne('999')).rejects.toThrow('Asset with ID 999 not found');
    });

    it('should convert id to number', async () => {
      service.findOne.mockResolvedValue(mockCryptoAsset);

      await controller.findOne('42');

      expect(service.findOne).toHaveBeenCalledWith(42);
    });

    it('should work with both asset types', async () => {
      service.findOne.mockResolvedValueOnce(mockCryptoAsset);
      service.findOne.mockResolvedValueOnce(mockNFTAsset);

      const cryptoResult = await controller.findOne('1');
      const nftResult = await controller.findOne('2');

      expect((cryptoResult as CryptoAsset).symbol).toBe('BTC');
      expect((nftResult as NFTAsset).collectionName).toBe('Bored Ape Yacht Club');
    });
  });

  describe('create', () => {
    const mockRequest = {
      user: { id: 1, email: 'test@example.com', role: 'user' },
    };

    it('should return 201 and created crypto asset', async () => {
      const createDto = {
        type: 'crypto' as const,
        amount: 1.5,
        middlePrice: 50000,
        symbol: 'BTC',
        fullName: 'Bitcoin',
        currentPrice: 52000,
      };

      service.create.mockResolvedValue(mockCryptoAsset);

      const result = await controller.create(createDto, mockRequest as any);

      expect(service.create).toHaveBeenCalledWith({ ...createDto, userId: 1 });
      expect(result).toEqual(mockCryptoAsset);
    });

    it('should return 201 and created nft asset', async () => {
      const createDto = {
        type: 'nft' as const,
        amount: 1,
        middlePrice: 10,
        collectionName: 'BAYC',
        floorPrice: 15,
        traitPrice: 20,
      };

      service.create.mockResolvedValue(mockNFTAsset);

      const result = await controller.create(createDto, mockRequest as any);

      expect(service.create).toHaveBeenCalledWith({ ...createDto, userId: 1 });
      expect(result).toEqual(mockNFTAsset);
    });

    it('should call service.create() with dto and userId', async () => {
      const createDto = {
        type: 'crypto' as const,
        amount: 2.0,
        middlePrice: 48000,
        symbol: 'ETH',
        fullName: 'Ethereum',
        currentPrice: 49000,
      };

      await controller.create(createDto, mockRequest as any);

      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith({ ...createDto, userId: 1 });
    });
  });

  describe('update', () => {
    it('should return 200 and updated asset', async () => {
      const updateDto = { amount: 2.0 };
      const updatedAsset = { ...mockCryptoAsset, amount: 2.0 };

      service.update.mockResolvedValue(updatedAsset);

      const result = await controller.update('1', updateDto as any);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result?.amount).toBe(2.0);
    });

    it('should convert id to number', async () => {
      const updateDto = { amount: 3.0 };
      service.update.mockResolvedValue({ ...mockCryptoAsset, amount: 3.0 });

      await controller.update('42', updateDto as any);

      expect(service.update).toHaveBeenCalledWith(42, updateDto);
    });

    it('should throw NotFoundException if asset not found', async () => {
      const updateDto = { amount: 2.0 };
      service.update.mockResolvedValue(null);

      await expect(controller.update('999', updateDto as any)).rejects.toThrow('Asset with ID 999 not found');
    });
  });

  describe('remove', () => {
    it('should return 200/204', async () => {
      service.findOne.mockResolvedValue(mockCryptoAsset);
      service.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should convert id to number', async () => {
      service.findOne.mockResolvedValue(mockCryptoAsset);
      await controller.remove('42');

      expect(service.remove).toHaveBeenCalledWith(42);
    });

    it('should throw NotFoundException on non-existent asset', async () => {
      service.findOne.mockResolvedValue(null);

      await expect(controller.remove('999')).rejects.toThrow('Asset with ID 999 not found');
    });
  });
});
