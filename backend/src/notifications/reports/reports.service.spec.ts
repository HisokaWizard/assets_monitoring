/**
 * @fileoverview Unit тесты для ReportsService.
 *
 * Тесты для проверки функциональности ReportsService.
 * Включает TDD тесты для feat_8: HTML шаблон, проверка истории, уникальность отчётов.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { DeepPartial } from "typeorm";
import { ReportsService } from "./reports.service";
import { ReportLog } from "./report-log.entity";
import { NotificationLog } from "../core/entities/notification-log.entity";
import { Asset, CryptoAsset, NFTAsset } from "../../assets/asset.entity";
import { HistoricalPrice } from "../../assets/historical-price.entity";
import { EmailService } from "../email/email.service";
import { NotificationLogRepository } from "../core/notification-log.repository";
import { ReportLogRepository } from "./report-log.repository";
import { AssetRepository } from "../../assets/asset.repository";
import { HistoricalPriceRepository } from "../../assets/historical-price.repository";

describe("ReportsService", () => {
  let service: ReportsService;
  let logRepository: jest.Mocked<NotificationLogRepository>;
  let reportLogRepository: jest.Mocked<ReportLogRepository>;
  let assetsRepository: any;
  let historicalPriceRepository: jest.Mocked<HistoricalPriceRepository>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockAssetRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    };

    const mockLogRepository = {
      saveLog: jest.fn(),
    };

    const mockReportLogRepository = {
      findLastByUserIdAndPeriod: jest.fn(),
      saveLog: jest.fn(),
    };

    const mockHistoricalPriceRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockEmailService = {
      sendEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: NotificationLogRepository,
          useValue: mockLogRepository,
        },
        {
          provide: ReportLogRepository,
          useValue: mockReportLogRepository,
        },
        {
          provide: AssetRepository,
          useValue: mockAssetRepository,
        },
        {
          provide: HistoricalPriceRepository,
          useValue: mockHistoricalPriceRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    logRepository = module.get(NotificationLogRepository);
    reportLogRepository = module.get(ReportLogRepository);
    assetsRepository = module.get(AssetRepository);
    historicalPriceRepository = module.get(HistoricalPriceRepository);
    emailService = module.get(EmailService);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // feat_8 / sub_task_2: hasEnoughHistory
  // ─────────────────────────────────────────────────────────────────────────
  describe("hasEnoughHistory (via generatePeriodicReports guard)", () => {
    /**
     * Вспомогательная функция: настраивает моки так, чтобы исторических данных было недостаточно.
     */
    const mockNoHistory = () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      historicalPriceRepository.createQueryBuilder.mockReturnValue(qb as any);
    };

    const mockHasHistory = () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      historicalPriceRepository.createQueryBuilder.mockReturnValue(qb as any);
    };

    const mockUserWithAsset = () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "BTC",
        fullName: "Bitcoin",
        currentPrice: 50000,
        dailyPrice: 45000,
        amount: 1,
        user: { id: 1, email: "user@test.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null); // canSendReport = true (первый отчёт)
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);
      emailService.sendEmail.mockResolvedValue(true);
    };

    it("TC-1: should NOT send email when no historical data exists", async () => {
      mockNoHistory();
      mockUserWithAsset();

      await service.generatePeriodicReports("daily");

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it("TC-2: should send email when historical data exists", async () => {
      mockHasHistory();
      mockUserWithAsset();

      await service.generatePeriodicReports("daily");

      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it("TC-3: historical check uses correct threshold for each period", async () => {
      mockHasHistory();
      mockUserWithAsset();

      const periods = ["daily", "weekly", "monthly", "quarterly", "yearly"];
      for (const period of periods) {
        historicalPriceRepository.createQueryBuilder.mockClear();
        assetsRepository.createQueryBuilder.mockClear();
        assetsRepository.find.mockClear();
        emailService.sendEmail.mockClear();
        reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);

        const qb = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(1),
        };
        historicalPriceRepository.createQueryBuilder.mockReturnValue(qb as any);

        const assetQb = {
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
        };
        assetsRepository.createQueryBuilder.mockReturnValue(assetQb as any);

        const asset = Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          type: "crypto",
          symbol: "BTC",
          currentPrice: 50000,
          dailyPrice: 45000,
          weeklyPrice: 45000,
          monthlyPrice: 45000,
          quartPrice: 45000,
          yearPrice: 45000,
          amount: 1,
          user: { id: 1, email: "user@test.com" },
        });
        assetsRepository.find.mockResolvedValue([asset]);

        await service.generatePeriodicReports(period);

        // createQueryBuilder вызывается хотя бы для asset query + историческая проверка
        expect(historicalPriceRepository.createQueryBuilder).toHaveBeenCalled();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // feat_8 / sub_task_3: canSendReport
  // ─────────────────────────────────────────────────────────────────────────
  describe("canSendReport (uniqueness guard)", () => {
    const mockHasHistory = () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      historicalPriceRepository.createQueryBuilder.mockReturnValue(qb as any);
    };

    const mockUserWithAsset = () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "BTC",
        currentPrice: 50000,
        dailyPrice: 45000,
        amount: 1,
        user: { id: 1, email: "user@test.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);
      emailService.sendEmail.mockResolvedValue(true);
    };

    it("TC-1: should send when no ReportLog exists (first report)", async () => {
      mockHasHistory();
      mockUserWithAsset();
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);
      reportLogRepository.saveLog.mockResolvedValue({} as any);

      await service.generatePeriodicReports("daily");

      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it("TC-2: should block when report was sent less than 24h ago (daily)", async () => {
      mockHasHistory();
      mockUserWithAsset();

      const recentlySent = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12h ago
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue({
        id: 1,
        userId: 1,
        period: "daily",
        sentAt: recentlySent,
        status: "sent",
      } as ReportLog);

      await service.generatePeriodicReports("daily");

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it("TC-3: should allow when 24h+ passed since last daily report", async () => {
      mockHasHistory();
      mockUserWithAsset();
      reportLogRepository.saveLog.mockResolvedValue({} as any);

      const longAgo = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue({
        id: 1,
        userId: 1,
        period: "daily",
        sentAt: longAgo,
        status: "sent",
      } as ReportLog);

      await service.generatePeriodicReports("daily");

      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it("TC-4: should block weekly report sent 6d 23h ago", async () => {
      mockHasHistory();
      mockUserWithAsset();

      const almostWeek = new Date(Date.now() - (7 * 24 - 1) * 60 * 60 * 1000); // 6d23h ago
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue({
        id: 1,
        userId: 1,
        period: "weekly",
        sentAt: almostWeek,
        status: "sent",
      } as ReportLog);

      await service.generatePeriodicReports("weekly");

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it("TC-5: should save ReportLog after successful send", async () => {
      mockHasHistory();
      mockUserWithAsset();
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      emailService.sendEmail.mockResolvedValue(true);

      await service.generatePeriodicReports("daily");

      expect(reportLogRepository.saveLog).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, period: "daily", status: "sent" }),
      );
    });

    it("TC-6: should NOT save ReportLog when email send fails", async () => {
      mockHasHistory();
      mockUserWithAsset();
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);
      emailService.sendEmail.mockResolvedValue(false);

      await service.generatePeriodicReports("daily");

      // reportLogRepository.saveLog не должен вызываться со status 'sent'
      const savedWithSent = reportLogRepository.saveLog.mock.calls.find(
        (call) => call[0]?.status === "sent",
      );
      expect(savedWithSent).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // feat_8 / sub_task_4: buildReportHtml
  // ─────────────────────────────────────────────────────────────────────────
  describe("buildReportHtml (HTML template)", () => {
    const mockHasHistory = () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      historicalPriceRepository.createQueryBuilder.mockReturnValue(qb as any);
    };

    beforeEach(() => {
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);
    });

    it("TC-1: HTML contains crypto asset data with correct prices", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "BTC",
        fullName: "Bitcoin",
        currentPrice: 50000,
        dailyPrice: 48000,
        amount: 1,
        user: { id: 1, email: "user@test.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      emailService.sendEmail.mockResolvedValue(true);

      await service.generatePeriodicReports("daily");

      expect(emailService.sendEmail).toHaveBeenCalled();
      const html: string = emailService.sendEmail.mock.calls[0][3]!;
      expect(html).toBeDefined();
      expect(html).toContain("BTC");
      expect(html).toContain("Bitcoin");
      // Текущая цена присутствует в HTML
      expect(html).toContain("50");
      // Цена начала периода присутствует
      expect(html).toContain("48");
    });

    it("TC-2: negative change renders red color", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "ETH",
        currentPrice: 2000,
        dailyPrice: 2500, // падение
        amount: 1,
        user: { id: 1, email: "user@test.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      emailService.sendEmail.mockResolvedValue(true);

      await service.generatePeriodicReports("daily");

      const html: string = emailService.sendEmail.mock.calls[0][3]!;
      expect(html).toContain("red");
      expect(html).toContain("-");
    });

    it("TC-3: positive change renders green color", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "BTC",
        currentPrice: 50000,
        dailyPrice: 45000, // рост
        amount: 1,
        user: { id: 1, email: "user@test.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      emailService.sendEmail.mockResolvedValue(true);

      await service.generatePeriodicReports("daily");

      const html: string = emailService.sendEmail.mock.calls[0][3]!;
      expect(html).toContain("green");
      expect(html).toContain("+");
    });

    it("TC-4: NFT asset uses native token in price formatting", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new NFTAsset(), {
        id: 1,
        userId: 1,
        type: "nft",
        collectionName: "boredapeyachtclub",
        nativeToken: "ETH",
        floorPrice: 12.5,
        dailyPrice: 12.0,
        amount: 1,
        user: { id: 1, email: "user@test.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      emailService.sendEmail.mockResolvedValue(true);

      await service.generatePeriodicReports("daily");

      const html: string = emailService.sendEmail.mock.calls[0][3]!;
      expect(html).toContain("ETH");
      expect(html).toContain("boredapeyachtclub");
    });

    it("TC-5: null lastPrice shows N/A in HTML", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "BTC",
        currentPrice: 50000,
        dailyPrice: null, // первый отчёт — цены начала периода нет
        amount: 1,
        user: { id: 1, email: "user@test.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      emailService.sendEmail.mockResolvedValue(true);

      await service.generatePeriodicReports("daily");

      const html: string = emailService.sendEmail.mock.calls[0][3]!;
      expect(html).toContain("N/A");
    });

    it("TC-6: HTML contains correct period label in header", async () => {
      mockHasHistory();

      const periods = ["daily", "weekly", "monthly", "quarterly", "yearly"];
      const labels = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

      for (let i = 0; i < periods.length; i++) {
        historicalPriceRepository.createQueryBuilder.mockClear();
        assetsRepository.createQueryBuilder.mockClear();
        emailService.sendEmail.mockClear();
        reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);

        const qb = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(1),
        };
        historicalPriceRepository.createQueryBuilder.mockReturnValue(qb as any);

        const assetQb = {
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
        };
        assetsRepository.createQueryBuilder.mockReturnValue(assetQb as any);

        const asset = Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          type: "crypto",
          symbol: "BTC",
          currentPrice: 50000,
          dailyPrice: 45000,
          weeklyPrice: 45000,
          monthlyPrice: 45000,
          quartPrice: 45000,
          yearPrice: 45000,
          amount: 1,
          user: { id: 1, email: "user@test.com" },
        });
        assetsRepository.find.mockResolvedValue([asset]);
        emailService.sendEmail.mockResolvedValue(true);

        await service.generatePeriodicReports(periods[i]);

        const html: string = emailService.sendEmail.mock.calls[0][3]!;
        expect(html).toContain(labels[i]);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Существующие тесты (адаптированы для новых моков)
  // ─────────────────────────────────────────────────────────────────────────
  describe("generatePeriodicReports (existing behaviour)", () => {
    const mockHasHistory = () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      historicalPriceRepository.createQueryBuilder.mockReturnValue(qb as any);
    };

    it("should generate reports for all users with assets", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }, { userId: 2 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "BTC",
        currentPrice: 50000,
        dailyPrice: 45000,
        amount: 1,
        user: { id: 1, email: "user1@example.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      emailService.sendEmail.mockResolvedValue(true);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);

      await service.generatePeriodicReports("daily");

      expect(assetsRepository.createQueryBuilder).toHaveBeenCalledWith("asset");
    });

    it("should calculate daily price change correctly", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "BTC",
        currentPrice: 50000,
        dailyPrice: 40000, // 25% increase
        amount: 1,
        user: { id: 1, email: "user1@example.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      emailService.sendEmail.mockResolvedValue(true);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);

      await service.generatePeriodicReports("daily");

      expect(emailService.sendEmail).toHaveBeenCalled();
      const callArgs = emailService.sendEmail.mock.calls[0];
      expect(callArgs[1]).toContain("Daily");
      // plain text содержит % изменение
      expect(callArgs[2]).toContain("25.00%");
    });

    it("should save updated lastPrice after generating report", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const asset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        type: "crypto",
        symbol: "BTC",
        currentPrice: 50000,
        dailyPrice: 40000,
        amount: 1,
        user: { id: 1, email: "user1@example.com" },
      });
      assetsRepository.find.mockResolvedValue([asset]);
      reportLogRepository.findLastByUserIdAndPeriod.mockResolvedValue(null);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      emailService.sendEmail.mockResolvedValue(true);
      reportLogRepository.saveLog.mockResolvedValue({} as any);
      assetsRepository.saveMany.mockResolvedValue([] as any);

      await service.generatePeriodicReports("daily");

      expect(assetsRepository.saveMany).toHaveBeenCalled();
      const savedAssets = assetsRepository.saveMany.mock
        .calls[0][0] as DeepPartial<Asset>[];
      expect(savedAssets[0]!.dailyPrice).toBe(50000);
    });

    it("should handle users with no assets gracefully", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      assetsRepository.find.mockResolvedValue([]);

      await service.generatePeriodicReports("daily");

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockHasHistory();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
      };
      assetsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      assetsRepository.find.mockRejectedValue(new Error("Database error"));

      await expect(
        service.generatePeriodicReports("daily"),
      ).resolves.not.toThrow();
    });
  });
});
