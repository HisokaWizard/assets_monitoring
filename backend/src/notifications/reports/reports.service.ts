/**
 * @fileoverview Сервис для генерации периодических отчетов.
 *
 * Этот файл содержит логику для создания отчетов по портфелю
 * с расчетом изменений цен за различные периоды.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from '../core/entities/notification-log.entity';
import { Asset, CryptoAsset, NFTAsset } from '../../assets/asset.entity';
import { EmailService } from '../email/email.service';

/**
 * Сервис для отчетов.
 *
 * Генерирует периодические отчеты (daily, weekly, monthly, quarterly, yearly)
 * и отправляет их пользователям по email.
 *
 * @Injectable регистрирует класс как провайдер в контейнере зависимостей.
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    private readonly emailService: EmailService,
  ) {}

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

    const reportData = [];

    for (const asset of assets) {
      const lastPrice = this.getLastPriceForPeriod(asset, period);
      const currentPrice = this.getCurrentPrice(asset);

      let change = 0;
      if (lastPrice && lastPrice !== 0) {
        change = ((currentPrice - lastPrice) / lastPrice) * 100;
      }

      // Обновляем last*Price на текущую цену
      this.setLastPriceForPeriod(asset, period, currentPrice);

      const name = asset instanceof CryptoAsset ? asset.symbol : (asset as NFTAsset).collectionName;
      const totalValue = asset.amount * currentPrice;

      reportData.push({
        name,
        type: asset instanceof CryptoAsset ? 'Crypto' : 'NFT',
        currentPrice,
        change,
        totalValue,
      });
    }

    // Сохраняем обновленные активы
    await this.assetsRepository.save(assets);

    await this.sendReportEmail(user, period, reportData);
  }

  /**
   * Отправка email с отчетом.
   *
   * @param user Пользователь
   * @param period Период отчета
   * @param reportData Данные отчета
   */
  private async sendReportEmail(
    user: { id: number; email: string },
    period: string,
    reportData: Array<{
      name: string;
      type: string;
      currentPrice: number;
      change: number;
      totalValue: number;
    }>,
  ): Promise<void> {
    const subject = `Portfolio ${period.charAt(0).toUpperCase() + period.slice(1)} Report`;
    const message = this.buildReportMessage(reportData, period);

    const success = await this.emailService.sendEmail(user.email, subject, message);

    // Логируем отправку
    await this.logRepository.save({
      userId: user.id,
      type: 'report',
      subject,
      message,
      sentAt: new Date(),
      status: success ? 'sent' : 'failed',
    });

    if (success) {
      this.logger.log(`Report sent to user ${user.id}`);
    } else {
      this.logger.error(`Failed to send report to user ${user.id}`);
    }
  }

  /**
   * Получение последней цены для периода.
   *
   * @param asset Актив
   * @param period Период
   * @returns Последняя цена
   */
  private getLastPriceForPeriod(asset: Asset, period: string): number | null {
    switch (period) {
      case 'daily':
        return asset.dailyPrice;
      case 'weekly':
        return asset.weeklyPrice;
      case 'monthly':
        return asset.monthlyPrice;
      case 'quarterly':
        return asset.quartPrice;
      case 'yearly':
        return asset.yearPrice;
      default:
        return asset.dailyPrice;
    }
  }

  /**
   * Установка последней цены для периода.
   *
   * @param asset Актив
   * @param period Период
   * @param price Цена
   */
  private setLastPriceForPeriod(asset: Asset, period: string, price: number): void {
    switch (period) {
      case 'daily':
        asset.dailyPrice = price;
        break;
      case 'weekly':
        asset.weeklyPrice = price;
        break;
      case 'monthly':
        asset.monthlyPrice = price;
        break;
      case 'quarterly':
        asset.quartPrice = price;
        break;
      case 'yearly':
        asset.yearPrice = price;
        break;
      default:
        asset.dailyPrice = price;
        break;
    }
  }

  /**
   * Получение текущей цены актива.
   *
   * @param asset Актив
   * @returns Текущая цена
   */
  private getCurrentPrice(asset: Asset): number {
    return asset instanceof CryptoAsset ? asset.currentPrice : (asset as NFTAsset).floorPrice;
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

    message += `Total Portfolio Value: $${totalPortfolioValue.toFixed(2)}\n\n`;
    message += 'Please review your investments and consider your strategy.';

    return message;
  }
}
