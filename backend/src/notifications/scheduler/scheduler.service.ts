/**
 * @fileoverview Сервис для планирования задач уведомлений.
 *
 * Этот файл содержит cron джобы для автоматического обновления активов,
 * проверки алертов и генерации отчетов по расписанию.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AssetUpdateService } from '../../assets/asset-update.service';
import { NotificationService } from '../notification.service';

/**
 * Сервис для планирования.
 *
 * Использует @nestjs/schedule для автоматического выполнения
 * задач обновления активов, проверки алертов и генерации отчетов.
 *
 * @Injectable регистрирует класс как провайдер в контейнере зависимостей.
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly assetUpdateService: AssetUpdateService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Cron джоба для обновления активов каждые 4 часа.
   *
   * Обновляет активы по пользовательским настройкам, проверяет алерты и генерирует ежедневные отчеты.
   */
  @Cron('0 */4 * * *')
  async handleAssetUpdatesAndNotifications() {
    this.logger.log('Running scheduled asset updates and notifications');
    try {
      await this.assetUpdateService.updateAssetsForUsers();
      this.logger.log('Asset updates completed');

      await this.notificationService.checkAlertsAfterUpdate();
      this.logger.log('Alert checks after update completed');

      await this.notificationService.generatePeriodicReports('daily');
      this.logger.log('Daily reports completed');
    } catch (error) {
      this.logger.error(`Error during asset updates and notifications: ${error.message}`);
    }
  }

  /**
   * Cron джоба для генерации еженедельных отчетов каждую неделю в понедельник в 9:00.
   */
  @Cron('0 9 * * 1')
  async handleWeeklyReports() {
    this.logger.log('Running scheduled weekly reports');
    try {
      await this.notificationService.generatePeriodicReports('weekly');
      this.logger.log('Weekly reports completed');
    } catch (error) {
      this.logger.error(`Error during weekly reports: ${error.message}`);
    }
  }

  /**
   * Cron джоба для генерации ежемесячных отчетов 1 числа каждого месяца в 9:00.
   */
  @Cron('0 9 1 * *')
  async handleMonthlyReports() {
    this.logger.log('Running scheduled monthly reports');
    try {
      await this.notificationService.generatePeriodicReports('monthly');
      this.logger.log('Monthly reports completed');
    } catch (error) {
      this.logger.error(`Error during monthly reports: ${error.message}`);
    }
  }

  /**
   * Cron джоба для генерации ежеквартальных отчетов 1 числа каждого квартала в 9:00.
   */
  @Cron('0 9 1 */3 *')
  async handleQuarterlyReports() {
    this.logger.log('Running scheduled quarterly reports');
    try {
      await this.notificationService.generatePeriodicReports('quarterly');
      this.logger.log('Quarterly reports completed');
    } catch (error) {
      this.logger.error(`Error during quarterly reports: ${error.message}`);
    }
  }

  /**
   * Cron джоба для генерации ежегодных отчетов 1 января в 9:00.
   */
  @Cron('0 9 1 1 *')
  async handleYearlyReports() {
    this.logger.log('Running scheduled yearly reports');
    try {
      await this.notificationService.generatePeriodicReports('yearly');
      this.logger.log('Yearly reports completed');
    } catch (error) {
      this.logger.error(`Error during yearly reports: ${error.message}`);
    }
  }

  /**
   * Ручной запуск обновления активов и уведомлений.
   *
   * Для тестирования или ручного запуска.
   */
  async triggerAssetUpdatesAndNotifications(): Promise<void> {
    this.logger.log('Manually triggering asset updates and notifications');
    await this.assetUpdateService.updateAssetsForUsers();
    await this.notificationService.checkAlertsAfterUpdate();
    await this.notificationService.generatePeriodicReports('daily');
  }
}
