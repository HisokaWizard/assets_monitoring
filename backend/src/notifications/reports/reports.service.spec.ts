/**
 * @fileoverview Unit тесты для ReportsService.
 *
 * Тесты для проверки функциональности ReportsService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { NotificationLog } from '../core/entities/notification-log.entity';
import { Asset, CryptoAsset } from '../../assets/asset.entity';
import { EmailService } from '../email/email.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let logRepository: jest.Mocked<Repository<NotificationLog>>;
  let assetsRepository: jest.Mocked<Repository<Asset>>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const mockEmailService = {
      sendEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    logRepository = module.get(getRepositoryToken(NotificationLog));
    assetsRepository = module.get(getRepositoryToken(Asset));
    emailService = module.get(EmailService);
  });

  describe('generatePeriodicReports', () => {
    it('should generate reports for all users with assets', async () => {
      // Arrange
      const mockUserIds = [{ userId: 1 }, { userId: 2 }];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockUserIds),
      };

      assetsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: 'BTC',
          currentPrice: 50000,
          dailyPrice: 45000,
          amount: 1,
          user: { id: 1, email: 'user1@example.com' },
        }),
      ];

      assetsRepository.find.mockResolvedValue(mockAssets);
      emailService.sendEmail.mockResolvedValue(true);
      logRepository.save.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);

      // Act
      await service.generatePeriodicReports('daily');

      // Assert
      expect(assetsRepository.createQueryBuilder).toHaveBeenCalledWith('asset');
      expect(assetsRepository.find).toHaveBeenCalledTimes(2);
    });

    it('should calculate daily price change correctly', async () => {
      // Arrange
      const mockUserIds = [{ userId: 1 }];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockUserIds),
      };

      assetsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: 'BTC',
          currentPrice: 50000,
          dailyPrice: 40000, // 25% increase
          amount: 1,
          user: { id: 1, email: 'user1@example.com' },
        }),
      ];

      assetsRepository.find.mockResolvedValue(mockAssets);
      emailService.sendEmail.mockResolvedValue(true);
      logRepository.save.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);

      // Act
      await service.generatePeriodicReports('daily');

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalled();
      const callArgs = emailService.sendEmail.mock.calls[0];
      expect(callArgs[1]).toContain('Daily');
      expect(callArgs[2]).toContain('25.00%');
    });

    it('should calculate weekly price change correctly', async () => {
      // Arrange
      const mockUserIds = [{ userId: 1 }];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockUserIds),
      };

      assetsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: 'BTC',
          currentPrice: 50000,
          weeklyPrice: 55000, // -9.09% decrease
          amount: 1,
          user: { id: 1, email: 'user1@example.com' },
        }),
      ];

      assetsRepository.find.mockResolvedValue(mockAssets);
      emailService.sendEmail.mockResolvedValue(true);
      logRepository.save.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);

      // Act
      await service.generatePeriodicReports('weekly');

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalled();
      const callArgs = emailService.sendEmail.mock.calls[0];
      expect(callArgs[1]).toContain('Weekly');
    });

    it('should save updated lastPrice after generating report', async () => {
      // Arrange
      const mockUserIds = [{ userId: 1 }];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockUserIds),
      };

      assetsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const mockAsset = Object.assign(new CryptoAsset(), {
        id: 1,
        userId: 1,
        symbol: 'BTC',
        currentPrice: 50000,
        dailyPrice: 40000,
        amount: 1,
        user: { id: 1, email: 'user1@example.com' },
      });

      assetsRepository.find.mockResolvedValue([mockAsset]);
      emailService.sendEmail.mockResolvedValue(true);
      logRepository.save.mockResolvedValue({} as any);
      assetsRepository.save.mockResolvedValue({} as any);

      // Act
      await service.generatePeriodicReports('daily');

      // Assert
      expect(assetsRepository.save).toHaveBeenCalled();
      const savedAssets = assetsRepository.save.mock.calls[0][0];
      expect(savedAssets[0].dailyPrice).toBe(50000);
    });

    it('should handle users with no assets gracefully', async () => {
      // Arrange
      const mockUserIds = [{ userId: 1 }];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockUserIds),
      };

      assetsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      assetsRepository.find.mockResolvedValue([]);

      // Act
      await service.generatePeriodicReports('daily');

      // Assert
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const mockUserIds = [{ userId: 1 }];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockUserIds),
      };

      assetsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      assetsRepository.find.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.generatePeriodicReports('daily')).resolves.not.toThrow();
    });
  });
});
