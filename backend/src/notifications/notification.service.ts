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
import { NotificationSettings } from './notification-settings.entity';
import { NotificationLog } from './notification-log.entity';
import { Asset, CryptoAsset, NFTAsset } from '../assets/asset.entity';
import { User } from '../auth/user.entity';
import { EmailService } from './email.service';

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
  ) {}

  /**
   * Проверка алертов после обновлений активов.
   *
   * @param userId Опциональный ID пользователя для фильтрации
   * @param assetIds Опциональный массив ID активов для проверки
   */
  async checkAlertsAfterUpdate(userId?: number, assetIds?: number[]): Promise<void> {
    this.logger.log(
      `Checking alerts after update for user ${userId || 'all'}, assets ${
        assetIds?.join(', ') || 'all'
      }`,
    );

    let query = this.settingsRepository
      .createQueryBuilder('setting')
      .leftJoinAndSelect('setting.user', 'user')
      .where('setting.enabled = :enabled', { enabled: true });

    if (userId) {
      query = query.andWhere('setting.userId = :userId', { userId });
    }

    const settings = await query.getMany();

    for (const setting of settings) {
      try {
        await this.checkUserAlertsAfterUpdate(setting, assetIds);
      } catch (error) {
        this.logger.error(`Error checking alerts for user ${setting.userId}: ${error.message}`);
      }
    }
  }

  /**
   * Проверка алертов для конкретного пользователя после обновлений.
   *
   * @param setting Настройки уведомлений пользователя
   * @param assetIds Опциональный массив ID активов
   */
  private async checkUserAlertsAfterUpdate(
    setting: NotificationSettings,
    assetIds?: number[],
  ): Promise<void> {
    const now = new Date();
    const intervalMs = setting.intervalHours * 60 * 60 * 1000;

    // Проверяем, прошел ли интервал с последнего уведомления
    if (setting.lastNotified && now.getTime() - setting.lastNotified.getTime() < intervalMs) {
      return;
    }

    // Получаем активы пользователя
    let assetsQuery = this.assetsRepository
      .createQueryBuilder('asset')
      .where('asset.userId = :userId', { userId: setting.userId });

    if (assetIds && assetIds.length > 0) {
      assetsQuery = assetsQuery.andWhere('asset.id IN (:...assetIds)', { assetIds });
    }

    const allAssets = await assetsQuery.getMany();

    // Фильтруем по типу
    const assets = allAssets.filter((asset) => {
      if (setting.assetType === 'crypto') {
        return asset instanceof CryptoAsset;
      } else if (setting.assetType === 'nft') {
        return asset instanceof NFTAsset;
      }
      return false;
    });

    const alertsTriggered = [];

    for (const asset of assets) {
      const change = this.calculatePriceChange(asset);
      if (Math.abs(change) >= setting.thresholdPercent) {
        const assetName =
          asset instanceof CryptoAsset ? asset.symbol : (asset as NFTAsset).collectionName;
        const currentPrice =
          asset instanceof CryptoAsset ? asset.currentPrice : (asset as NFTAsset).floorPrice;
        alertsTriggered.push({
          asset: assetName,
          change: change.toFixed(2),
          currentPrice,
        });
      }
    }

    if (alertsTriggered.length > 0) {
      await this.sendNotification('alert', setting.user, { alerts: alertsTriggered });
      setting.lastNotified = now;
      await this.settingsRepository.save(setting);
    }
  }

  /**
   * Генерация периодических отчетов.
   *
   * @param period Период отчета ('daily', 'weekly', etc.)
   */
  async generatePeriodicReports(period: string): Promise<void> {
    this.logger.log(`Generating ${period} reports`);

    // Получаем уникальных пользователей
    const userIds = await this.assetsRepository
      .createQueryBuilder('asset')
      .select('DISTINCT asset.userId', 'userId')
      .getRawMany();

    for (const { userId } of userIds) {
      try {
        await this.generateUserPeriodicReport(userId, period);
      } catch (error) {
        this.logger.error(`Error generating ${period} report for user ${userId}: ${error.message}`);
      }
    }
  }

  /**
   * Генерация периодического отчета для конкретного пользователя.
   *
   * @param userId ID пользователя
   * @param period Период отчета
   */
  private async generateUserPeriodicReport(userId: number, period: string): Promise<void> {
    const assets = await this.assetsRepository.find({
      where: { userId },
      relations: ['user'],
    });

    if (assets.length === 0 || !assets[0].user) return;

    const user = assets[0].user;

    // Определяем порог для отчета в зависимости от периода
    const threshold = this.getPeriodThreshold(period);

    // Находим активы с значительными изменениями
    const significantChanges = assets.filter((asset) => {
      const change = this.getChangeForPeriod(asset, period);
      return Math.abs(change || 0) >= threshold;
    });

    if (significantChanges.length === 0) {
      this.logger.log(`No significant ${period} changes for user ${userId}, skipping report`);
      return;
    }

    const reportData = this.buildReportData(significantChanges);
    await this.sendNotification('report', user, { period, reportData });
  }

  /**
   * Получение порога для периода.
   *
   * @param period Период
   * @returns Порог изменения в процентах
   */
  private getPeriodThreshold(period: string): number {
    switch (period) {
      case 'daily':
        return 5;
      case 'weekly':
        return 10;
      case 'monthly':
        return 20;
      default:
        return 5;
    }
  }

  /**
   * Получение изменения цены для периода.
   *
   * @param asset Актив
   * @param period Период
   * @returns Процентное изменение
   */
  private getChangeForPeriod(asset: Asset, period: string): number | null {
    switch (period) {
      case 'daily':
        return asset.dailyChange;
      case 'weekly':
        return asset.weeklyChange;
      case 'monthly':
        return asset.monthlyChange;
      default:
        return asset.dailyChange;
    }
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
   * Вычисление изменения цены актива.
   *
   * @param asset Актив
   * @returns Процентное изменение
   */
  private calculatePriceChange(asset: Asset): number {
    if (!asset.middlePrice || asset.middlePrice === 0) return 0;

    const currentPrice =
      asset instanceof CryptoAsset ? asset.currentPrice : (asset as NFTAsset).floorPrice;
    return ((currentPrice - asset.middlePrice) / asset.middlePrice) * 100;
  }

  /**
   * Построение данных отчета.
   *
   * @param assets Активы с изменениями
   * @returns Данные отчета
   */
  private buildReportData(assets: Asset[]): Array<{
    name: string;
    type: string;
    currentPrice: number;
    change: number;
    totalValue: number;
  }> {
    return assets.map((asset) => {
      const name = asset instanceof CryptoAsset ? asset.symbol : (asset as NFTAsset).collectionName;
      const currentPrice =
        asset instanceof CryptoAsset ? asset.currentPrice : (asset as NFTAsset).floorPrice;
      const totalValue = asset.amount * currentPrice;
      const change = asset.dailyChange || 0; // Для простоты используем dailyChange

      return {
        name,
        type: asset instanceof CryptoAsset ? 'Crypto' : 'NFT',
        currentPrice,
        change,
        totalValue,
      };
    });
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
    } Report - Assets with Significant Changes:\n\n`;

    let totalPortfolioValue = 0;

    for (const item of reportData) {
      message += `${item.type}: ${item.name}\n`;
      message += `  Current Price: $${item.currentPrice.toFixed(2)}\n`;
      message += `  Change: ${item.change.toFixed(2)}%\n`;
      message += `  Total Value: $${item.totalValue.toFixed(2)}\n\n`;

      totalPortfolioValue += item.totalValue;
    }

    message += `Total Portfolio Value (significant changes): $${totalPortfolioValue.toFixed(
      2,
    )}\n\n`;
    message += 'Please review your investments and consider your strategy.';

    return message;
  }
}
