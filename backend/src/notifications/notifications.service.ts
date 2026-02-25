/**
 * @fileoverview Сервис уведомлений.
 *
 * Этот файл содержит логику для отправки уведомлений пользователям.
 * В текущей реализации это placeholder, который может быть расширен
 * для интеграции с email сервисами, push-уведомлениями и т.д.
 *
 * Сервисы позволяют централизованно управлять бизнес-логикой уведомлений.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendNotificationDto } from './core/dto/send-notification.dto';
import { CreateNotificationSettingsDto } from './core/dto/create-notification-settings.dto';
import { UpdateNotificationSettingsDto } from './core/dto/update-notification-settings.dto';
import { GenerateReportDto } from './core/dto/generate-report.dto';
import { NotificationSettings } from './core/entities/notification-settings.entity';
import { HistoricalPrice } from '../assets/historical-price.entity';
import { NotificationLog } from './core/entities/notification-log.entity';
import { EmailService } from './email/email.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { ReportsService } from './reports/reports.service';

/**
 * Сервис для отправки уведомлений.
 *
 * Предоставляет метод для отправки уведомлений различными способами.
 * В данной реализации логирует данные и возвращает успешный ответ.
 *
 * @Injectable регистрирует класс как провайдер в контейнере зависимостей.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationSettings)
    private readonly settingsRepository: Repository<NotificationSettings>,
    @InjectRepository(HistoricalPrice)
    private readonly historicalPriceRepository: Repository<HistoricalPrice>,
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    private readonly emailService: EmailService,
    private readonly schedulerService: SchedulerService,
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * Отправка уведомления (устаревший метод, для совместимости).
   */
  async sendNotification(sendNotificationDto: SendNotificationDto): Promise<string> {
    const success = await this.emailService.sendEmail(
      sendNotificationDto.to,
      sendNotificationDto.subject,
      sendNotificationDto.message,
    );
    return success ? 'Notification sent successfully' : 'Failed to send notification';
  }

  /**
   * Получить настройки уведомлений пользователя.
   * Возвращает только последние настройки для каждого assetType.
   */
  async getUserSettings(userId: number): Promise<NotificationSettings[]> {
    const settings = await this.settingsRepository.find({
      where: { userId },
      order: { assetType: 'ASC', id: 'DESC' },
    });

    const uniqueByAssetType = settings.reduce((acc, curr) => {
      if (!acc[curr.assetType]) {
        acc[curr.assetType] = curr;
      }
      return acc;
    }, {} as Record<string, NotificationSettings>);

    return Object.values(uniqueByAssetType);
  }

  /**
   * Удалить дубликаты настроек для пользователя.
   */
  async cleanupDuplicateSettings(userId: number): Promise<number> {
    const allSettings = await this.settingsRepository.find({
      where: { userId },
      order: { id: 'DESC' },
    });

    const toDelete: number[] = [];
    const seen = new Set<string>();

    for (const setting of allSettings) {
      const key = setting.assetType;
      if (seen.has(key)) {
        toDelete.push(setting.id);
      } else {
        seen.add(key);
      }
    }

    if (toDelete.length > 0) {
      await this.settingsRepository.delete(toDelete);
    }

    return toDelete.length;
  }

  /**
   * Создать настройку уведомлений.
   * Если настройки для этого assetType уже существуют - возвращает их.
   */
  async createSettings(
    userId: number,
    dto: CreateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    const existing = await this.settingsRepository.findOne({
      where: { userId, assetType: dto.assetType },
    });

    if (existing) {
      return existing;
    }

    const settings = this.settingsRepository.create({
      userId,
      ...dto,
    });
    return this.settingsRepository.save(settings);
  }

  /**
   * Обновить настройку уведомлений.
   */
  async updateSettings(
    id: number,
    userId: number,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings | null> {
    await this.settingsRepository.update({ id, userId }, dto);
    return this.settingsRepository.findOneBy({ id });
  }

  /**
   * Удалить настройку уведомлений.
   */
  async deleteSettings(id: number, userId: number): Promise<{ deleted: boolean }> {
    const result = await this.settingsRepository.delete({ id, userId });
    return { deleted: (result.affected ?? 0) > 0 };
  }

  /**
   * Получить исторические цены актива.
   */
  async getAssetHistory(assetId: number, limit: number = 100): Promise<HistoricalPrice[]> {
    return this.historicalPriceRepository.find({
      where: { assetId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Сгенерировать отчет вручную.
   */
  async generateReport(userId: number, dto: GenerateReportDto): Promise<string> {
    const period = dto.period || 'daily';
    await this.reportsService.generateUserReport(userId, period);
    return `Report generation triggered for ${period} period`;
  }

  /**
   * Ручной запуск проверки алертов.
   */
  async triggerAssetUpdatesAndNotifications(): Promise<string> {
    await this.schedulerService.triggerAssetUpdatesAndNotifications();
    return 'Asset updates and notifications triggered';
  }

  /**
   * Получить логи уведомлений пользователя.
   */
  async getNotificationLogs(userId: number, limit: number = 50): Promise<NotificationLog[]> {
    return this.logRepository.find({
      where: { userId },
      order: { sentAt: 'DESC' },
      take: limit,
    });
  }
}
