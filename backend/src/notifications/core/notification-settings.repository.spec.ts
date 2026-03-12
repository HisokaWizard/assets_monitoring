/**
 * @fileoverview Unit тесты для NotificationSettingsRepository.
 *
 * Тесты для проверки функциональности кастомного репозитория настроек уведомлений.
 * RED-фаза TDD — репозиторий ещё не реализован.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationSettingsRepository } from "./notification-settings.repository";
import { NotificationSettings } from "./entities/notification-settings.entity";

describe("NotificationSettingsRepository", () => {
  let repository: NotificationSettingsRepository;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSettingsRepository,
        {
          provide: getRepositoryToken(NotificationSettings),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<NotificationSettingsRepository>(
      NotificationSettingsRepository,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findEnabledWithUser", () => {
    it("should return enabled settings with user relation", async () => {
      const mockSettings: Partial<NotificationSettings>[] = [
        { id: 1, userId: 1, enabled: true },
      ];
      (mockRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue(mockSettings),
      });

      const result = await repository.findEnabledWithUser();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("setting");
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        "setting.user",
        "user",
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "setting.enabled = :enabled",
        { enabled: true },
      );
      expect(result).toEqual(mockSettings);
    });

    it("should filter by userId when provided", async () => {
      const mockSettings: Partial<NotificationSettings>[] = [];
      const userId = 1;
      (mockRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue(mockSettings),
      });

      const result = await repository.findEnabledWithUser(userId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "setting.userId = :userId",
        { userId },
      );
      expect(result).toEqual(mockSettings);
    });

    it("should return empty array when no enabled settings", async () => {
      (mockRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        ...mockQueryBuilder,
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findEnabledWithUser();

      expect(result).toEqual([]);
    });
  });

  describe("findByUserId", () => {
    it("should return settings ordered by assetType ASC, id DESC", async () => {
      const mockSettings: Partial<NotificationSettings>[] = [];
      (mockRepository.find as jest.Mock).mockResolvedValue(mockSettings);

      const result = await repository.findByUserId(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { assetType: "ASC", id: "DESC" },
      });
      expect(result).toEqual(mockSettings);
    });
  });

  describe("findOneByUserIdAndAssetType", () => {
    it("should return setting when found", async () => {
      const mockSetting: Partial<NotificationSettings> = {
        id: 1,
        userId: 1,
        assetType: "crypto",
      };
      (mockRepository.findOneBy as jest.Mock).mockResolvedValue(mockSetting);

      const result = await repository.findOneByUserIdAndAssetType(1, "crypto");

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        userId: 1,
        assetType: "crypto",
      });
      expect(result).toEqual(mockSetting);
    });

    it("should return null when not found", async () => {
      (mockRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await repository.findOneByUserIdAndAssetType(1, "crypto");

      expect(result).toBeNull();
    });
  });

  describe("createAndSave", () => {
    it("should create and save notification settings", async () => {
      const mockSetting: Partial<NotificationSettings> = {
        userId: 1,
        assetType: "crypto",
        enabled: true,
      };
      const mockCreated = { ...mockSetting, id: 1 };
      (mockRepository.create as jest.Mock).mockReturnValue(mockCreated);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockCreated);

      const result = await repository.createAndSave(mockSetting);

      expect(mockRepository.create).toHaveBeenCalledWith(mockSetting);
      expect(mockRepository.save).toHaveBeenCalledWith(mockCreated);
      expect(result).toEqual(mockCreated);
    });
  });

  describe("updateByIdAndUserId", () => {
    it("should update settings matching id and userId", async () => {
      (mockRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await repository.updateByIdAndUserId(1, 1, { enabled: false });

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1, userId: 1 },
        { enabled: false },
      );
    });
  });

  describe("findOneById", () => {
    it("should return setting by id", async () => {
      const mockSetting: Partial<NotificationSettings> = { id: 1 };
      (mockRepository.findOneBy as jest.Mock).mockResolvedValue(mockSetting);

      const result = await repository.findOneById(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockSetting);
    });

    it("should return null when not found", async () => {
      (mockRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await repository.findOneById(999);

      expect(result).toBeNull();
    });
  });

  describe("deleteByIdAndUserId", () => {
    it("should delete and return affected count", async () => {
      (mockRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await repository.deleteByIdAndUserId(1, 1);

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1, userId: 1 });
      expect(result).toBe(1);
    });

    it("should return 0 when nothing to delete", async () => {
      (mockRepository.delete as jest.Mock).mockResolvedValue({ affected: 0 });

      const result = await repository.deleteByIdAndUserId(999, 999);

      expect(result).toBe(0);
    });
  });

  describe("saveSettings", () => {
    it("should save and return the settings entity", async () => {
      const mockSetting: Partial<NotificationSettings> = {
        id: 1,
        enabled: true,
      };
      (mockRepository.save as jest.Mock).mockResolvedValue(mockSetting);

      const result = await repository.saveSettings(
        mockSetting as NotificationSettings,
      );

      expect(mockRepository.save).toHaveBeenCalledWith(mockSetting);
      expect(result).toEqual(mockSetting);
    });
  });

  describe("findEnabledWithUserRelations", () => {
    it("should return enabled settings with user relations for asset update", async () => {
      const mockSettings: Partial<NotificationSettings>[] = [
        {
          id: 1,
          enabled: true,
          user: { id: 1, email: "test@test.com" } as any,
        },
      ];
      (mockRepository.find as jest.Mock).mockResolvedValue(mockSettings);

      const result = await repository.findEnabledWithUserRelations();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { enabled: true },
        relations: ["user"],
      });
      expect(result).toEqual(mockSettings);
    });
  });
});
