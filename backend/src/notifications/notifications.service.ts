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
   */
  async getUserSettings(userId: number): Promise<NotificationSettings[]> {
    return this.settingsRepository.find({
      where: { userId },
      order: { assetType: 'ASC' },
    });
  }

  /**
   * Создать настройку уведомлений.
   */
  async createSettings(
    userId: number,
    dto: CreateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
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
  async deleteSettings(id: number, userId: number): Promise<void> {
    await this.settingsRepository.delete({ id, userId });
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
    // Для простоты, генерируем отчет для пользователя
    await this.reportsService.generatePeriodicReports('daily');
    return 'Report generation triggered';
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
