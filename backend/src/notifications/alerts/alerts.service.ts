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
 * Данные об отдельном срабатывании алерта по активу.
 */
interface AlertTriggered {
  /** Тип актива: crypto или nft */
  assetType: 'crypto' | 'nft';
  /** Основное название: symbol для crypto, collectionName для nft */
  name: string;
  /** Полное название криптовалюты (только для crypto) */
  fullName?: string;
  /** Символ нативного токена (только для nft) */
  nativeToken?: string;
  /** Цена до изменения (previousPrice) */
  previousPrice: number;
  /** Текущая цена после изменения */
  currentPrice: number;
  /** % изменения со знаком (+/-) */
  change: string;
}

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

    const alertsTriggered: AlertTriggered[] = [];

    for (const asset of assets) {
      const change = this.calculatePriceChange(asset);
      if (Math.abs(change) >= setting.thresholdPercent) {
        if (asset instanceof CryptoAsset) {
          alertsTriggered.push({
            assetType: 'crypto',
            name: asset.symbol,
            fullName: asset.fullName,
            previousPrice: asset.previousPrice,
            currentPrice: asset.currentPrice,
            change: (change >= 0 ? '+' : '') + change.toFixed(2),
          });
        } else {
          const nftAsset = asset as NFTAsset;
          alertsTriggered.push({
            assetType: 'nft',
            name: nftAsset.collectionName,
            nativeToken: nftAsset.nativeToken,
            previousPrice: nftAsset.previousPrice,
            currentPrice: nftAsset.floorPrice,
            change: (change >= 0 ? '+' : '') + change.toFixed(2),
          });
        }
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
    alertsTriggered: AlertTriggered[],
  ): Promise<void> {
    const subject = `Price Alert for ${setting.assetType.toUpperCase()} Assets`;
    const plainText = this.buildAlertPlainText(alertsTriggered);
    const html = this.buildAlertHtml(alertsTriggered);

    const success = await this.emailService.sendEmail(setting.user.email, subject, plainText, html);

    // Логируем отправку
    await this.logRepository.save({
      userId: setting.userId,
      type: 'alert',
      subject,
      message: plainText,
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
   * Построение plain-text сообщения алерта (для логов и text-части письма).
   *
   * @param alertsTriggered Список алертов
   * @returns Текст сообщения
   */
  private buildAlertPlainText(alertsTriggered: AlertTriggered[]): string {
    let message = 'Sharp price changes detected:\n\n';

    for (const alert of alertsTriggered) {
      const label = alert.assetType === 'crypto'
        ? `${alert.name}${alert.fullName ? ` (${alert.fullName})` : ''}`
        : `${alert.name}${alert.nativeToken ? ` [${alert.nativeToken}]` : ''}`;
      message += `${label}: ${alert.change}% change`;
      message += `, Price before: ${alert.previousPrice}`;
      message += `, Current price: ${alert.currentPrice}\n`;
    }

    message += '\nPlease check your portfolio for more details.';
    return message;
  }

  /**
   * Построение HTML-шаблона срочного алерта о резком изменении цены.
   *
   * Возвращает табличный HTML совместимый с email-клиентами (inline-стили).
   * Единый шаблон для crypto и nft — разница только в данных.
   * Цвет % изменения: зеленый при росте, красный при падении.
   *
   * @param alertsTriggered Список алертов
   * @returns HTML-строка письма
   */
  private buildAlertHtml(alertsTriggered: AlertTriggered[]): string {
    const rows = alertsTriggered.map((alert) => {
      const isPositive = !alert.change.startsWith('-');
      const changeColor = isPositive ? 'green' : 'red';

      const typeBadge = alert.assetType.toUpperCase();

      // Название: для crypto — symbol + fullName, для nft — collectionName + nativeToken
      const nameCell = alert.assetType === 'crypto'
        ? `<strong>${alert.name}</strong>${alert.fullName ? `<br><small style="color:#666;">${alert.fullName}</small>` : ''}`
        : `<strong>${alert.name}</strong>${alert.nativeToken ? `<br><small style="color:#666;">${alert.nativeToken}</small>` : ''}`;

      // Цена: для crypto — USD ($), для nft — нативный токен
      const pricePrefix = alert.assetType === 'crypto' ? '$' : '';
      const priceSuffix = alert.assetType === 'nft' && alert.nativeToken ? ` ${alert.nativeToken}` : '';

      const formatPrice = (price: number) =>
        `${pricePrefix}${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}${priceSuffix}`;

      return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 14px; font-size: 12px; font-weight: bold; color: #555; white-space: nowrap;">${typeBadge}</td>
          <td style="padding: 10px 14px; font-size: 14px;">${nameCell}</td>
          <td style="padding: 10px 14px; font-size: 14px; white-space: nowrap;">${formatPrice(alert.previousPrice)}</td>
          <td style="padding: 10px 14px; font-size: 14px; white-space: nowrap;">${formatPrice(alert.currentPrice)}</td>
          <td style="padding: 10px 14px; font-size: 15px; font-weight: bold; color: ${changeColor}; white-space: nowrap;">${alert.change}%</td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Alert Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: #c0392b; padding: 20px 24px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">
                Price Alert Report
              </h1>
              <p style="margin: 6px 0 0; color: #f5c6c6; font-size: 13px;">
                Sharp price change detected in your portfolio
              </p>
            </td>
          </tr>

          <!-- Table -->
          <tr>
            <td style="padding: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <!-- Table Header -->
                <thead>
                  <tr style="background-color: #f8f8f8;">
                    <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Type</th>
                    <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Asset</th>
                    <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Price Before</th>
                    <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Price After</th>
                    <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Change</th>
                  </tr>
                </thead>
                <!-- Table Body -->
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <p style="margin: 0; font-size: 13px; color: #888;">
                Please review your portfolio and consider your strategy.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
