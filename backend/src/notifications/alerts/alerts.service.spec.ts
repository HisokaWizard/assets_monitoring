/**
 * @fileoverview Unit тесты для AlertsService.
 *
 * Тесты для проверки функциональности AlertsService.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { AlertsService } from "./alerts.service";
import { NotificationSettings } from "../core/entities/notification-settings.entity";
import { NotificationLog } from "../core/entities/notification-log.entity";
import { Asset, CryptoAsset, NFTAsset } from "../../assets/asset.entity";
import { EmailService } from "../email/email.service";
import { NotificationSettingsRepository } from "../core/notification-settings.repository";
import { NotificationLogRepository } from "../core/notification-log.repository";
import { AssetRepository } from "../../assets/asset.repository";

describe("AlertsService", () => {
  let service: AlertsService;
  let settingsRepository: jest.Mocked<NotificationSettingsRepository>;
  let logRepository: jest.Mocked<NotificationLogRepository>;
  let assetsRepository: jest.Mocked<AssetRepository>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const mockAssetsQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const mockRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const mockEmailService = {
      sendEmail: jest.fn(),
    };

    const mockSettingsRepository = {
      findEnabledWithUser: jest.fn(),
      findByUserId: jest.fn(),
      saveSettings: jest.fn(),
    };

    const mockLogRepository = {
      saveLog: jest.fn(),
    };

    const mockAssetRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockAssetsQueryBuilder),
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: NotificationSettingsRepository,
          useValue: mockSettingsRepository,
        },
        {
          provide: NotificationLogRepository,
          useValue: mockLogRepository,
        },
        {
          provide: AssetRepository,
          useValue: mockAssetRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    settingsRepository = module.get(NotificationSettingsRepository);
    logRepository = module.get(NotificationLogRepository);
    assetsRepository = module.get(AssetRepository);
    emailService = module.get(EmailService);
  });

  describe("checkAlertsAfterUpdate", () => {
    it("should check alerts for all users when no userId provided", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          updateIntervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      // Act
      await service.checkAlertsAfterUpdate();

      // Assert
      expect(settingsRepository.findEnabledWithUser).toHaveBeenCalledWith(
        undefined,
      );
    });

    it("should filter by userId when provided", async () => {
      // Arrange
      const userId = 1;
      const mockSettings: NotificationSettings[] = [];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      // Act
      await service.checkAlertsAfterUpdate(userId);

      // Assert
      expect(settingsRepository.findEnabledWithUser).toHaveBeenCalledWith(
        userId,
      );
    });

    it("should trigger alert when price change exceeds threshold", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          updateIntervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: "BTC",
          currentPrice: 50000,
          previousPrice: 40000, // 25% change, exceeds 5% threshold
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(
        mockAssets,
      );

      emailService.sendEmail.mockResolvedValue(true);
      (logRepository.saveLog as jest.Mock).mockResolvedValue({} as any);
      (settingsRepository.saveSettings as jest.Mock).mockResolvedValue(
        {} as any,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(logRepository.saveLog).toHaveBeenCalled();
      expect(settingsRepository.saveSettings).toHaveBeenCalled();
    });

    it("should not trigger alert when interval has not passed", async () => {
      // Arrange
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago

      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          lastNotified: recentDate,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      // Assert
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          updateIntervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      // Act & Assert
      await service.checkAlertsAfterUpdate();

      expect(settingsRepository.findEnabledWithUser).toHaveBeenCalled();
    });
  });

  // ─── sub_task_1: TDD тесты для HTML-шаблона ───────────────────────────────

  describe("buildAlertHtml (HTML template)", () => {
    it("should contain required sections for crypto alert", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          updateIntervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: "BTC",
          fullName: "Bitcoin",
          currentPrice: 50000,
          previousPrice: 40000,
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(
        mockAssets,
      );

      emailService.sendEmail.mockResolvedValue(true);
      (logRepository.saveLog as jest.Mock).mockResolvedValue({} as any);
      (settingsRepository.saveSettings as jest.Mock).mockResolvedValue(
        {} as any,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      // Assert: emailService.sendEmail должен получить 4й аргумент (html) содержащий <table>
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(String),
        expect.any(String),
        expect.stringContaining("<table"),
      );
    });

    it("should include asset name and price data in html", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          updateIntervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: "BTC",
          fullName: "Bitcoin",
          currentPrice: 50000,
          previousPrice: 40000,
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(
        mockAssets,
      );

      emailService.sendEmail.mockResolvedValue(true);
      (logRepository.saveLog as jest.Mock).mockResolvedValue({} as any);
      (settingsRepository.saveSettings as jest.Mock).mockResolvedValue(
        {} as any,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      const htmlArg = (emailService.sendEmail as jest.Mock).mock
        .calls[0][3] as string;

      // Assert: HTML содержит название, цены и заголовок
      expect(htmlArg).toContain("BTC");
      expect(htmlArg).toContain("40"); // previousPrice
      expect(htmlArg).toContain("50"); // currentPrice
      expect(htmlArg).toContain("+25.00");
    });

    it("should mark price increase in green color", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          updateIntervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: "ETH",
          fullName: "Ethereum",
          currentPrice: 1200,
          previousPrice: 1000, // +20%
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(
        mockAssets,
      );

      emailService.sendEmail.mockResolvedValue(true);
      (logRepository.saveLog as jest.Mock).mockResolvedValue({} as any);
      (settingsRepository.saveSettings as jest.Mock).mockResolvedValue(
        {} as any,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      const htmlArg = (emailService.sendEmail as jest.Mock).mock
        .calls[0][3] as string;

      // Assert: HTML содержит зеленый цвет для роста
      expect(htmlArg).toContain("green");
    });

    it("should mark price decrease in red color", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 10,
          intervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: "SOL",
          fullName: "Solana",
          currentPrice: 80,
          previousPrice: 100, // -20%
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(
        mockAssets,
      );

      emailService.sendEmail.mockResolvedValue(true);
      (logRepository.saveLog as jest.Mock).mockResolvedValue({} as any);
      (settingsRepository.saveSettings as jest.Mock).mockResolvedValue(
        {} as any,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      const htmlArg = (emailService.sendEmail as jest.Mock).mock
        .calls[0][3] as string;

      // Assert: HTML содержит красный цвет для падения
      expect(htmlArg).toContain("red");
      expect(htmlArg).toContain("-20.00");
    });

    it("should include urgent report header in html", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          updateIntervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: "BTC",
          fullName: "Bitcoin",
          currentPrice: 50000,
          previousPrice: 40000,
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(
        mockAssets,
      );

      emailService.sendEmail.mockResolvedValue(true);
      (logRepository.saveLog as jest.Mock).mockResolvedValue({} as any);
      (settingsRepository.saveSettings as jest.Mock).mockResolvedValue(
        {} as any,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      const htmlArg = (emailService.sendEmail as jest.Mock).mock
        .calls[0][3] as string;

      // Assert: HTML содержит заголовок о резком изменении цены
      expect(htmlArg).toContain("Price Alert");
    });

    it("should handle NFT asset in html template", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "nft",
          enabled: true,
          thresholdPercent: 10,
          intervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssets = [
        Object.assign(new NFTAsset(), {
          id: 1,
          userId: 1,
          collectionName: "azuki",
          nativeToken: "ETH",
          floorPrice: 7,
          floorPriceUsd: 21000,
          previousPrice: 10, // -30%
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(
        mockAssets,
      );

      emailService.sendEmail.mockResolvedValue(true);
      (logRepository.saveLog as jest.Mock).mockResolvedValue({} as any);
      (settingsRepository.saveSettings as jest.Mock).mockResolvedValue(
        {} as any,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      const htmlArg = (emailService.sendEmail as jest.Mock).mock
        .calls[0][3] as string;

      // Assert: HTML содержит данные NFT
      expect(htmlArg).toContain("azuki");
      expect(htmlArg).toContain("ETH");
      expect(htmlArg).toContain("-30.00");
      expect(htmlArg).toContain("<table");
    });

    it("should pass previousPrice in alertsTriggered to sendAlertEmail", async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: "crypto",
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          updateIntervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: "test@example.com" } as any,
        } as NotificationSettings,
      ];

      (settingsRepository.findEnabledWithUser as jest.Mock).mockResolvedValue(
        mockSettings,
      );

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: "BTC",
          fullName: "Bitcoin",
          currentPrice: 50000,
          previousPrice: 40000,
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(
        mockAssets,
      );

      emailService.sendEmail.mockResolvedValue(true);
      (logRepository.saveLog as jest.Mock).mockResolvedValue({} as any);
      (settingsRepository.saveSettings as jest.Mock).mockResolvedValue(
        {} as any,
      );

      // Act
      await service.checkAlertsAfterUpdate();

      const htmlArg = (emailService.sendEmail as jest.Mock).mock
        .calls[0][3] as string;

      // Assert: HTML содержит previousPrice (40000)
      expect(htmlArg).toMatch(/40[,\s]?000|40000/);
    });
  });
});
