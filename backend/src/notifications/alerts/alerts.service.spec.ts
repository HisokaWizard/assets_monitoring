/**
 * @fileoverview Unit тесты для AlertsService.
 *
 * Тесты для проверки функциональности AlertsService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertsService } from './alerts.service';
import { NotificationSettings } from '../core/entities/notification-settings.entity';
import { NotificationLog } from '../core/entities/notification-log.entity';
import { Asset, CryptoAsset } from '../../assets/asset.entity';
import { EmailService } from '../email/email.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let settingsRepository: jest.Mocked<Repository<NotificationSettings>>;
  let logRepository: jest.Mocked<Repository<NotificationLog>>;
  let assetsRepository: jest.Mocked<Repository<Asset>>;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getRepositoryToken(NotificationSettings),
          useValue: {
            ...mockRepository,
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: {
            ...mockRepository,
            createQueryBuilder: jest.fn().mockReturnValue(mockAssetsQueryBuilder),
          },
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    settingsRepository = module.get(getRepositoryToken(NotificationSettings));
    logRepository = module.get(getRepositoryToken(NotificationLog));
    assetsRepository = module.get(getRepositoryToken(Asset));
    emailService = module.get(EmailService);
  });

  describe('checkAlertsAfterUpdate', () => {
    it('should check alerts for all users when no userId provided', async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: 'crypto',
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: 'test@example.com' } as any,
        } as NotificationSettings,
      ];

      const mockQueryBuilder = settingsRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(mockSettings);

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      // Act
      await service.checkAlertsAfterUpdate();

      // Assert
      expect(settingsRepository.createQueryBuilder).toHaveBeenCalledWith('setting');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('setting.enabled = :enabled', { enabled: true });
    });

    it('should filter by userId when provided', async () => {
      // Arrange
      const userId = 1;
      const mockSettings: NotificationSettings[] = [];

      const mockQueryBuilder = settingsRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(mockSettings);

      // Act
      await service.checkAlertsAfterUpdate(userId);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('setting.userId = :userId', { userId });
    });

    it('should trigger alert when price change exceeds threshold', async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: 'crypto',
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: 'test@example.com' } as any,
        } as NotificationSettings,
      ];

      const mockQueryBuilder = settingsRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(mockSettings);

      const mockAssets = [
        Object.assign(new CryptoAsset(), {
          id: 1,
          userId: 1,
          symbol: 'BTC',
          currentPrice: 50000,
          previousPrice: 40000, // 25% change, exceeds 5% threshold
          amount: 1,
        }),
      ];

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockResolvedValue(mockAssets);

      emailService.sendEmail.mockResolvedValue(true);
      logRepository.save.mockResolvedValue({} as any);
      settingsRepository.save.mockResolvedValue({} as any);

      // Act
      await service.checkAlertsAfterUpdate();

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(logRepository.save).toHaveBeenCalled();
      expect(settingsRepository.save).toHaveBeenCalled();
    });

    it('should not trigger alert when interval has not passed', async () => {
      // Arrange
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago

      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: 'crypto',
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          lastNotified: recentDate,
          user: { id: 1, email: 'test@example.com' } as any,
        } as NotificationSettings,
      ];

      const mockQueryBuilder = settingsRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(mockSettings);

      // Act
      await service.checkAlertsAfterUpdate();

      // Assert
      expect(emailService.sendEmail).not.toHaveBeenCalled();
      // Не проверяем createQueryBuilder для assets, так как мы не должны дойти до этого
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const mockSettings: NotificationSettings[] = [
        {
          id: 1,
          userId: 1,
          assetType: 'crypto',
          enabled: true,
          thresholdPercent: 5,
          intervalHours: 4,
          lastNotified: null,
          user: { id: 1, email: 'test@example.com' } as any,
        } as NotificationSettings,
      ];

      const mockQueryBuilder = settingsRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(mockSettings);

      const mockAssetsQueryBuilder = assetsRepository.createQueryBuilder();
      (mockAssetsQueryBuilder.getMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert - не должно выбрасывать ошибку, так как обрабатывается в catch
      await service.checkAlertsAfterUpdate();
      
      // Проверяем что метод отработал без исключения
      expect(settingsRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
