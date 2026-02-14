/**
 * @fileoverview Унифицированный сервис уведомлений.
 *
 * Этот файл объединяет функциональность алертов, отчетов и отправки уведомлений.
 * Предоставляет методы для проверки алертов после обновлений, генерации периодических отчетов
 * и унифицированной отправки уведомлений.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSettings } from './core/entities/notification-settings.entity';
import { NotificationLog } from './core/entities/notification-log.entity';
import { Asset, CryptoAsset, NFTAsset } from '../assets/asset.entity';
import { User } from '../auth/user.entity';
import { EmailService } from './email/email.service';
import { AlertsService } from './alerts/alerts.service';
import { ReportsService } from './reports/reports.service';

/**
 * Сервис уведомлений.
 *
 * Объединяет функциональность из AlertService, ReportService и EmailService.
 * Предоставляет унифицированные методы для работы с уведомлениями.
 *
 * @Injectable регистрирует класс как провайдер в контейнере зависимостей.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationSettings)
    private readonly settingsRepository: Repository<NotificationSettings>,
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly alertsService: AlertsService,
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * Проверка алертов после обновлений активов.
   *
   * Делегирует выполнение AlertsService.
   *
   * @param userId Опциональный ID пользователя для фильтрации
   * @param assetIds Опциональный массив ID активов для проверки
   */
  async checkAlertsAfterUpdate(userId?: number, assetIds?: number[]): Promise<void> {
    return this.alertsService.checkAlertsAfterUpdate(userId, assetIds);
  }

  /**
   * Генерация периодических отчетов.
   *
   * Делегирует выполнение ReportsService.
   *
   * @param period Период отчета ('daily', 'weekly', etc.)
   */
  async generatePeriodicReports(period: string): Promise<void> {
    return this.reportsService.generatePeriodicReports(period);
  }

  /**
   * Унифицированная отправка уведомлений.
   *
   * @param type Тип уведомления ('alert', 'report')
   * @param user Пользователь
   * @param data Данные для уведомления
   */
  async sendNotification(type: string, user: User, data: any): Promise<void> {
    let subject: string;
    let message: string;

    switch (type) {
      case 'alert':
        subject = `Price Alert for Assets`;
        message = this.buildAlertMessage(data.alerts);
        break;
      case 'report':
        subject = `Portfolio ${data.period.charAt(0).toUpperCase() + data.period.slice(1)} Report`;
        message = this.buildReportMessage(data.reportData, data.period);
        break;
      default:
        this.logger.error(`Unknown notification type: ${type}`);
        return;
    }

    const success = await this.emailService.sendEmail(user.email, subject, message);

    // Логируем отправку
    await this.logRepository.save({
      userId: user.id,
      type,
      subject,
      message,
      sentAt: new Date(),
      status: success ? 'sent' : 'failed',
    });

    if (success) {
      this.logger.log(`${type} notification sent to user ${user.id}`);
    } else {
      this.logger.error(`Failed to send ${type} notification to user ${user.id}`);
    }
  }

  /**
   * Построение сообщения алерта.
   *
   * @param alertsTriggered Список алертов
   * @returns Текст сообщения
   */
  private buildAlertMessage(
    alertsTriggered: Array<{ asset: string; change: string; currentPrice: number }>,
  ): string {
    let message = 'Sharp price changes detected:\n\n';

    for (const alert of alertsTriggered) {
      message += `${alert.asset}: ${alert.change}% change, Current price: $${alert.currentPrice}\n`;
    }

    message += '\nPlease check your portfolio for more details.';
    return message;
  }

  /**
   * Построение сообщения отчета.
   *
   * @param reportData Данные отчета
   * @param period Период
   * @returns Текст сообщения
   */
  private buildReportMessage(
    reportData: Array<{
      name: string;
      type: string;
      currentPrice: number;
      change: number;
      totalValue: number;
    }>,
    period: string,
  ): string {
    let message = `Portfolio ${
      period.charAt(0).toUpperCase() + period.slice(1)
    } Report - All Assets:\n\n`;

    let totalPortfolioValue = 0;

    for (const item of reportData) {
      message += `${item.type}: ${item.name}\n`;
      message += `  Current Price: $${item.currentPrice.toFixed(2)}\n`;
      message += `  Change: ${item.change.toFixed(2)}%\n`;
      message += `  Total Value: $${item.totalValue.toFixed(2)}\n\n`;

      totalPortfolioValue += item.totalValue;
    }

    message += `Total Portfolio Value: $${totalPortfolioValue.toFixed(
      2,
    )}\n\n`;
    message += 'Please review your investments and consider your strategy.';

    return message;
  }
}
