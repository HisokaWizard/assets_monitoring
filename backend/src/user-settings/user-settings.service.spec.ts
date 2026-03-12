/**
 * @fileoverview Тесты для UserSettingsService.
 *
 * Проверяет бизнес-логику и шифрование/дешифрование API-ключей.
 */

import { Test, TestingModule } from "@nestjs/testing";

import { UserSettingsService } from "./user-settings.service";
import { UserSettings } from "./core/entities/user-settings.entity";
import { CreateUserSettingsDto, UpdateUserSettingsDto } from "./core/dto";
import { UserSettingsRepository } from "./core/user-settings.repository";
import { User } from "../auth/user.entity";
import { UserRole } from "../auth/user-role.enum";

describe("UserSettingsService", () => {
  let service: UserSettingsService;
  let repository: jest.Mocked<UserSettingsRepository>;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    password: "hashed",
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUpdated: new Date(),
  } as User;

  const mockRepository = {
    findOneByUserId: jest.fn(),
    createAndSave: jest.fn(),
    updateByUserId: jest.fn(),
  };

  beforeEach(async () => {
    // Set encryption key for testing
    process.env.API_KEYS_ENCRYPTION_KEY = "test-encryption-key-32-chars-long!!";

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsService,
        {
          provide: UserSettingsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserSettingsService>(UserSettingsService);
    repository = module.get<UserSettingsRepository>(
      UserSettingsRepository,
    ) as jest.Mocked<UserSettingsRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserSettings", () => {
    it("should return null if settings not found", async () => {
      mockRepository.findOneByUserId.mockResolvedValue(null);

      const result = await service.getUserSettings(mockUser);

      expect(result).toBeNull();
      expect(mockRepository.findOneByUserId).toHaveBeenCalledWith(mockUser.id);
    });

    it("should return decrypted settings", async () => {
      // Create encrypted keys using service's encrypt method
      const plainKey = "test-key-32-chars-long-for-testing";
      const encryptedCmc = await (service as any).encrypt(plainKey);
      const encryptedOs = await (service as any).encrypt(plainKey);

      const encryptedSettings = {
        id: 1,
        userId: 1,
        coinmarketcapApiKey: encryptedCmc,
        openseaApiKey: encryptedOs,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findOneByUserId.mockResolvedValue(encryptedSettings);

      const result = await service.getUserSettings(mockUser);

      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
      expect(result!.coinmarketcapApiKey).toBe(plainKey);
      expect(result!.openseaApiKey).toBe(plainKey);
    });
  });

  describe("createSettings", () => {
    it("should create settings with encrypted keys", async () => {
      const plainCmcKey = "test-key-32-chars-long-for-cmc";
      const plainOsKey = "test-key-32-chars-long-for-os";
      const encryptedCmc = await (service as any).encrypt(plainCmcKey);
      const encryptedOs = await (service as any).encrypt(plainOsKey);

      mockRepository.findOneByUserId.mockResolvedValue(null);
      mockRepository.createAndSave.mockResolvedValue({
        id: 1,
        userId: 1,
        coinmarketcapApiKey: encryptedCmc,
        openseaApiKey: encryptedOs,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto: CreateUserSettingsDto = {
        coinmarketcapApiKey: plainCmcKey,
        openseaApiKey: plainOsKey,
      };

      const result = await service.createSettings(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.coinmarketcapApiKey).toBe(plainCmcKey);
      expect(result.openseaApiKey).toBe(plainOsKey);
      expect(mockRepository.createAndSave).toHaveBeenCalled();
    });

    it("should throw error if settings already exist", async () => {
      mockRepository.findOneByUserId.mockResolvedValue({ id: 1 });

      const dto: CreateUserSettingsDto = {};

      await expect(service.createSettings(mockUser, dto)).rejects.toThrow(
        "User settings already exist",
      );
    });

    it("should create settings with only one key", async () => {
      const plainKey = "test-key-32-chars-long-for-cmc";
      const encryptedKey = await (service as any).encrypt(plainKey);

      mockRepository.findOneByUserId.mockResolvedValue(null);
      mockRepository.createAndSave.mockResolvedValue({
        id: 1,
        userId: 1,
        coinmarketcapApiKey: encryptedKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto: CreateUserSettingsDto = {
        coinmarketcapApiKey: plainKey,
      };

      const result = await service.createSettings(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.coinmarketcapApiKey).toBe(plainKey);
    });
  });

  describe("updateSettings", () => {
    it("should update existing settings", async () => {
      const newKey = "new-key-32-chars-long-for-cmc";
      const encryptedNew = await (service as any).encrypt(newKey);
      const existingEncrypted = await (service as any).encrypt(
        "existing-key-32-chars-long!!",
      );

      mockRepository.findOneByUserId
        .mockResolvedValueOnce({ id: 1, userId: 1 })
        .mockResolvedValueOnce({
          id: 1,
          userId: 1,
          coinmarketcapApiKey: encryptedNew,
          openseaApiKey: existingEncrypted,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      mockRepository.updateByUserId.mockResolvedValue({ affected: 1 });

      const dto: UpdateUserSettingsDto = {
        coinmarketcapApiKey: newKey,
      };

      const result = await service.updateSettings(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.coinmarketcapApiKey).toBe(newKey);
      expect(mockRepository.updateByUserId).toHaveBeenCalled();
    });

    it("should create settings if not found", async () => {
      const plainKey = "new-key-32-chars-long";
      const encryptedKey = await (service as any).encrypt(plainKey);

      mockRepository.findOneByUserId.mockResolvedValue(null);
      mockRepository.createAndSave.mockResolvedValue({
        id: 1,
        userId: 1,
        coinmarketcapApiKey: encryptedKey,
        openseaApiKey: encryptedKey,
      });

      const dto: UpdateUserSettingsDto = { coinmarketcapApiKey: plainKey };

      const result = await service.updateSettings(mockUser, dto);

      expect(result).toBeDefined();
      expect(mockRepository.createAndSave).toHaveBeenCalled();
    });

    it("should handle partial update", async () => {
      const newKey = "new-key-32-chars-long-for-os";
      const encryptedNew = await (service as any).encrypt(newKey);
      const existingEncrypted = await (service as any).encrypt(
        "existing-key-32-chars-long!!",
      );

      mockRepository.findOneByUserId
        .mockResolvedValueOnce({ id: 1, userId: 1 })
        .mockResolvedValueOnce({
          id: 1,
          userId: 1,
          coinmarketcapApiKey: existingEncrypted,
          openseaApiKey: encryptedNew,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      mockRepository.updateByUserId.mockResolvedValue({ affected: 1 });

      const dto: UpdateUserSettingsDto = {
        openseaApiKey: newKey,
      };

      const result = await service.updateSettings(mockUser, dto);

      expect(result).toBeDefined();
      expect(result.openseaApiKey).toBe(newKey);
    });
  });

  describe("encryption", () => {
    it("should encrypt and decrypt text correctly", async () => {
      const plainText = "test-key-32-chars-long-for-testing!!";

      // Access private methods through any cast for testing
      const encrypted = await (service as any).encrypt(plainText);
      const decrypted = await (service as any).decrypt(encrypted);

      expect(decrypted).toBe(plainText);
      expect(encrypted).not.toBe(plainText);
      expect(encrypted).toContain(":"); // IV:data format
    });

    it("should produce different encrypted values for same text", async () => {
      const plainText = "test-key-32-chars-long-for-testing!!";

      const encrypted1 = await (service as any).encrypt(plainText);
      const encrypted2 = await (service as any).encrypt(plainText);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe("error handling", () => {
    it("should handle missing encryption key", async () => {
      delete process.env.API_KEYS_ENCRYPTION_KEY;

      await expect((service as any).getEncryptionKey()).rejects.toThrow(
        "API_KEYS_ENCRYPTION_KEY is not defined",
      );

      // Restore for other tests
      process.env.API_KEYS_ENCRYPTION_KEY =
        "test-encryption-key-32-chars-long!!";
    });
  });
});
