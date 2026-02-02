import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationSettings } from './notification-settings.entity';
import { NotificationLog } from './notification-log.entity';
import { HistoricalPrice } from '../assets/historical-price.entity';
import { EmailService } from './email.service';
import { AlertService } from './alert.service';
import { ReportService } from './report.service';
import { SchedulerService } from './scheduler.service';
import { CreateNotificationSettingsDto } from './dto/create-notification-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let settingsRepository: jest.Mocked<Repository<NotificationSettings>>;
  let historicalPriceRepository: jest.Mocked<Repository<HistoricalPrice>>;
  let logRepository: jest.Mocked<Repository<NotificationLog>>;
  let emailService: jest.Mocked<EmailService>;
  let alertService: jest.Mocked<AlertService>;
  let reportService: jest.Mocked<ReportService>;
  let schedulerService: jest.Mocked<SchedulerService>;

  const mockSettings: NotificationSettings = {
    id: 1,
    userId: 1,
    user: {} as any,
    assetType: 'crypto',
    enabled: true,
    thresholdPercent: 10,
    intervalHours: 4,
    updateIntervalHours: 4,
    lastNotified: new Date(),
  };

  const mockNotificationLog: NotificationLog = {
    id: 1,
    userId: 1,
    user: {} as any,
    type: 'alert',
    subject: 'Price Alert',
    message: 'BTC price increased by 10%',
    sentAt: new Date(),
    status: 'sent',
  };

  beforeEach(async () => {
    const mockSettingsRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockHistoricalPriceRepository = {
      find: jest.fn(),
    };

    const mockLogRepository = {
      find: jest.fn(),
    };

    const mockEmailService = {
      sendEmail: jest.fn(),
    };

    const mockAlertService = {
      checkAlerts: jest.fn(),
    };

    const mockReportService = {
      generateReports: jest.fn(),
    };

    const mockSchedulerService = {
      triggerAssetUpdatesAndNotifications: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationSettings),
          useValue: mockSettingsRepository,
        },
        {
          provide: getRepositoryToken(HistoricalPrice),
          useValue: mockHistoricalPriceRepository,
        },
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: mockLogRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AlertService,
          useValue: mockAlertService,
        },
        {
          provide: ReportService,
          useValue: mockReportService,
        },
        {
          provide: SchedulerService,
          useValue: mockSchedulerService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    settingsRepository = module.get(getRepositoryToken(NotificationSettings));
    historicalPriceRepository = module.get(getRepositoryToken(HistoricalPrice));
    logRepository = module.get(getRepositoryToken(NotificationLog));
    emailService = module.get(EmailService);
    alertService = module.get(AlertService);
    reportService = module.get(ReportService);
    schedulerService = module.get(SchedulerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('should return notification settings for user', async () => {
      const mockSettingsList = [mockSettings, { ...mockSettings, id: 2, assetType: 'nft' }];
      settingsRepository.find.mockResolvedValue(mockSettingsList);

      const result = await service.getUserSettings(1);

      expect(settingsRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { assetType: 'ASC' },
      });
      expect(result).toEqual(mockSettingsList);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no settings', async () => {
      settingsRepository.find.mockResolvedValue([]);

      const result = await service.getUserSettings(999);

      expect(result).toEqual([]);
    });
  });

  describe('createSettings', () => {
    it('should create notification settings', async () => {
      const createDto: CreateNotificationSettingsDto = {
        assetType: 'crypto',
        enabled: true,
        thresholdPercent: 15,
        intervalHours: 6,
        updateIntervalHours: 6,
      };

      const createdSettings = {
        ...mockSettings,
        id: undefined,
        assetType: createDto.assetType,
        thresholdPercent: createDto.thresholdPercent,
        intervalHours: createDto.intervalHours,
        updateIntervalHours: createDto.updateIntervalHours,
      };

      settingsRepository.create.mockReturnValue(createdSettings as NotificationSettings);
      settingsRepository.save.mockResolvedValue({
        ...createdSettings,
        id: 2,
      } as NotificationSettings);

      const result = await service.createSettings(1, createDto);

      expect(settingsRepository.create).toHaveBeenCalledWith({
        userId: 1,
        ...createDto,
      });
      expect(settingsRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateSettings', () => {
    it('should update notification settings', async () => {
      const updateDto = {
        enabled: false,
        thresholdPercent: 20,
      } as unknown as UpdateNotificationSettingsDto;

      const updatedSettings = { ...mockSettings, ...updateDto };
      settingsRepository.update.mockResolvedValue({ affected: 1 } as any);
      settingsRepository.findOneBy.mockResolvedValue(updatedSettings);

      const result = await service.updateSettings(1, 1, updateDto);

      expect(settingsRepository.update).toHaveBeenCalledWith({ id: 1, userId: 1 }, updateDto);
      expect(settingsRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(updatedSettings);
    });

    it('should return null when settings not found', async () => {
      const updateDto = {
        enabled: false,
      } as unknown as UpdateNotificationSettingsDto;

      settingsRepository.update.mockResolvedValue({ affected: 0 } as any);
      settingsRepository.findOneBy.mockResolvedValue(null);

      const result = await service.updateSettings(999, 1, updateDto);

      expect(result).toBeNull();
    });
  });

  describe('deleteSettings', () => {
    it('should delete notification settings', async () => {
      settingsRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.deleteSettings(1, 1);

      expect(settingsRepository.delete).toHaveBeenCalledWith({ id: 1, userId: 1 });
    });

    it('should not throw when deleting non-existent settings', async () => {
      settingsRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.deleteSettings(999, 1)).resolves.not.toThrow();
    });
  });

  describe('getNotificationLogs', () => {
    it('should return notification logs for user', async () => {
      const mockLogs = [mockNotificationLog, { ...mockNotificationLog, id: 2 }];
      logRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getNotificationLogs(1);

      expect(logRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { sentAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should respect custom limit', async () => {
      logRepository.find.mockResolvedValue([mockNotificationLog]);

      await service.getNotificationLogs(1, 10);

      expect(logRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { sentAt: 'DESC' },
        take: 10,
      });
    });

    it('should return empty array when no logs', async () => {
      logRepository.find.mockResolvedValue([]);

      const result = await service.getNotificationLogs(999);

      expect(result).toEqual([]);
    });
  });
});
