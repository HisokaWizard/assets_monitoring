/**
 * @fileoverview Unit тесты для NotificationLogRepository.
 *
 * Тесты для проверки функциональности кастомного репозитория логов уведомлений.
 * RED-фаза TDD — репозиторий ещё не реализован.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationLogRepository } from "./notification-log.repository";
import { NotificationLog } from "./entities/notification-log.entity";

describe("NotificationLogRepository", () => {
  let repository: NotificationLogRepository;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
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
        NotificationLogRepository,
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<NotificationLogRepository>(
      NotificationLogRepository,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveLog", () => {
    it("should save notification log entry", async () => {
      const mockLog: Partial<NotificationLog> = {
        userId: 1,
        type: "alert",
        subject: "Test Alert",
        message: "Test message",
        status: "sent",
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

    it("should set correct type and status", async () => {
      const mockLog: Partial<NotificationLog> = {
        userId: 1,
        type: "report",
        subject: "Daily Report",
        message: "Report content",
        status: "failed",
        sentAt: new Date(),
      };
      const mockCreated = { ...mockLog, id: 1 };
      (mockRepository.create as jest.Mock).mockReturnValue(mockCreated);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockCreated);

      const result = await repository.saveLog(mockLog);

      expect(result.type).toBe("report");
      expect(result.status).toBe("failed");
    });
  });

  describe("findByUserIdWithLimit", () => {
    it("should return logs ordered by sentAt DESC", async () => {
      const mockLogs: Partial<NotificationLog>[] = [
        { id: 1, userId: 1, sentAt: new Date() },
      ];
      (mockRepository.find as jest.Mock).mockResolvedValue(mockLogs);

      const result = await repository.findByUserIdWithLimit(1, 10);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { sentAt: "DESC" },
        take: 10,
      });
      expect(result).toEqual(mockLogs);
    });

    it("should limit results", async () => {
      const mockLogs: Partial<NotificationLog>[] = [];
      (mockRepository.find as jest.Mock).mockResolvedValue(mockLogs);

      await repository.findByUserIdWithLimit(1, 5);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it("should return empty array when no logs", async () => {
      (mockRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByUserIdWithLimit(999, 10);

      expect(result).toEqual([]);
    });
  });
});
