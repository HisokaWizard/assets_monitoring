/**
 * @fileoverview Сервис для проверки ценовых алертов.
 *
 * Этот файл содержит логику для проверки изменений цен активов
 * и отправки уведомлений пользователям на основе их настроек.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSettings } from '../core/entities/notification-settings.entity';
import { NotificationLog } from '../core/entities/notification-log.entity';
import { Asset, CryptoAsset, NFTAsset } from '../../assets/asset.entity';
import { EmailService } from '../email/email.service';

/**
 * Сервис для алертов.
 *
 * Проверяет изменения цен активов и отправляет уведомления
 * пользователям, если превышен порог и прошел интервал.
 *
 * @Injectable регистрирует класс как провайдер в контейнере зависимостей.
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(NotificationSettings)
    private readonly settingsRepository: Repository<NotificationSettings>,
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
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
      await this.sendAlertEmail(setting, alertsTriggered);
      setting.lastNotified = now;
      await this.settingsRepository.save(setting);
    }
  }

  /**
   * Вычисление изменения цены актива за интервал обновлений.
   *
   * @param asset Актив
   * @returns Процентное изменение
   */
  private calculatePriceChange(asset: Asset): number {
    if (!asset.previousPrice || asset.previousPrice === 0) return 0;

    const currentPrice =
      asset instanceof CryptoAsset ? asset.currentPrice : (asset as NFTAsset).floorPrice;
    return ((currentPrice - asset.previousPrice) / asset.previousPrice) * 100;
  }

  /**
   * Отправка email с алертом.
   *
   * @param setting Настройки
   * @param alertsTriggered Список алертов
   */
  private async sendAlertEmail(
    setting: NotificationSettings,
    alertsTriggered: Array<{ asset: string; change: string; currentPrice: number }>,
  ): Promise<void> {
    const subject = `Price Alert for ${setting.assetType.toUpperCase()} Assets`;
    const message = this.buildAlertMessage(alertsTriggered);

    const success = await this.emailService.sendEmail(setting.user.email, subject, message);

    // Логируем отправку
    await this.logRepository.save({
      userId: setting.userId,
      type: 'alert',
      subject,
      message,
      sentAt: new Date(),
      status: success ? 'sent' : 'failed',
    });

    if (success) {
      this.logger.log(`Alert sent to user ${setting.userId}`);
    } else {
      this.logger.error(`Failed to send alert to user ${setting.userId}`);
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
}
