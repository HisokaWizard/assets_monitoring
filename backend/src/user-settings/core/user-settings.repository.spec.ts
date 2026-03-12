/**
 * @fileoverview Тесты для UserSettingsRepository.
 *
 * Проверяет методы работы с настройками пользователя в БД.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserSettings } from "./entities/user-settings.entity";
import { UserSettingsRepository } from "./user-settings.repository";

describe("UserSettingsRepository", () => {
  let repository: UserSettingsRepository;
  let ormRepository: Repository<UserSettings>;

  const mockOrmRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsRepository,
        {
          provide: getRepositoryToken(UserSettings),
          useValue: mockOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserSettingsRepository>(UserSettingsRepository);
    ormRepository = module.get<Repository<UserSettings>>(
      getRepositoryToken(UserSettings),
    );

    jest.clearAllMocks();
  });

  describe("findOneByUserId", () => {
    it("should return settings when found by userId", async () => {
      const mockSettings = {
        id: 1,
        userId: 1,
        coinmarketcapApiKey: "encrypted-key",
        openseaApiKey: "encrypted-key",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrmRepository.findOne.mockResolvedValue(mockSettings);

      const result = await repository.findOneByUserId(1);

      expect(result).toEqual(mockSettings);
      expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it("should return null when settings not found", async () => {
      mockOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOneByUserId(999);

      expect(result).toBeNull();
      expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 999 },
      });
    });
  });

  describe("createAndSave", () => {
    it("should create entity from partial data and save", async () => {
      const partialData = {
        userId: 1,
        coinmarketcapApiKey: "encrypted-key",
        openseaApiKey: "encrypted-key",
      };

      const mockSavedSettings = {
        id: 1,
        ...partialData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrmRepository.create.mockReturnValue(partialData);
      mockOrmRepository.save.mockResolvedValue(mockSavedSettings);

      const result = await repository.createAndSave(partialData);

      expect(mockOrmRepository.create).toHaveBeenCalledWith(partialData);
      expect(mockOrmRepository.save).toHaveBeenCalledWith(partialData);
      expect(result).toEqual(mockSavedSettings);
    });

    it("should return the saved entity", async () => {
      const partialData = { userId: 1 };
      const mockSavedSettings = {
        id: 1,
        userId: 1,
        coinmarketcapApiKey: undefined,
        openseaApiKey: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrmRepository.create.mockReturnValue(partialData);
      mockOrmRepository.save.mockResolvedValue(mockSavedSettings);

      const result = await repository.createAndSave(partialData);

      expect(result).toEqual(mockSavedSettings);
    });
  });

  describe("updateByUserId", () => {
    it("should call update with correct userId filter", async () => {
      const userId = 1;
      const updateData = { coinmarketcapApiKey: "new-key" };

      mockOrmRepository.update.mockResolvedValue({ affected: 1 });

      await repository.updateByUserId(userId, updateData);

      expect(mockOrmRepository.update).toHaveBeenCalledWith(
        { userId },
        updateData,
      );
    });

    it("should pass data to update", async () => {
      const userId = 1;
      const updateData = {
        coinmarketcapApiKey: "encrypted-key",
        openseaApiKey: "encrypted-key",
      };

      mockOrmRepository.update.mockResolvedValue({ affected: 1 });

      await repository.updateByUserId(userId, updateData);

      expect(mockOrmRepository.update).toHaveBeenCalledWith(
        { userId },
        updateData,
      );
    });
  });
});
