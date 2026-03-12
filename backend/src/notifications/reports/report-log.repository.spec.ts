/**
 * @fileoverview Unit тесты для ReportLogRepository.
 *
 * Тесты для проверки функциональности кастомного репозитория логов отчётов.
 * RED-фаза TDD — репозиторий ещё не реализован.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReportLogRepository } from "./report-log.repository";
import { ReportLog } from "./report-log.entity";

describe("ReportLogRepository", () => {
  let repository: ReportLogRepository;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportLogRepository,
        {
          provide: getRepositoryToken(ReportLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<ReportLogRepository>(ReportLogRepository);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findLastByUserIdAndPeriod", () => {
    it("should return last report log for user and period", async () => {
      const mockLog: Partial<ReportLog> = {
        id: 1,
        userId: 1,
        period: "daily",
        sentAt: new Date(),
      };
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockLog);

      const result = await repository.findLastByUserIdAndPeriod(1, "daily");

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1, period: "daily" },
        order: { sentAt: "DESC" },
      });
      expect(result).toEqual(mockLog);
    });

    it("should return null when no reports found", async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findLastByUserIdAndPeriod(999, "daily");

      expect(result).toBeNull();
    });

    it("should order by sentAt DESC", async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      await repository.findLastByUserIdAndPeriod(1, "weekly");

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { sentAt: "DESC" },
        }),
      );
    });
  });

  describe("saveLog", () => {
    it("should save report log entry", async () => {
      const mockLog: Partial<ReportLog> = {
        userId: 1,
        period: "daily",
        sentAt: new Date(),
      };
      const mockCreated = { ...mockLog, id: 1 };
      (mockRepository.create as jest.Mock).mockReturnValue(mockCreated);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockCreated);

      const result = await repository.saveLog(mockLog);

      expect(mockRepository.create).toHaveBeenCalledWith(mockLog);
      expect(mockRepository.save).toHaveBeenCalledWith(mockCreated);
      expect(result).toEqual(mockCreated);
    });
  });
});
