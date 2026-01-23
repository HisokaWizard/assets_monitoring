/**
 * @fileoverview Сервис для генерации отчетов по портфелю.
 *
 * Этот файл содержит логику для создания отчетов о активах
 * с резкими изменениями цен и отправки их пользователям.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './notification-log.entity';
import { Asset, CryptoAsset, NFTAsset } from '../assets/asset.entity';
import { EmailService } from './email.service';

/**
 * Сервис для отчетов.
 *
 * Генерирует отчеты по портфелю для активов с резкими изменениями
 * и отправляет их пользователям по email.
 *
 * @Injectable регистрирует класс как провайдер в контейнере зависимостей.
 */
@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Генерация отчетов для всех пользователей.
   *
   * Находит активы с резкими изменениями и отправляет отчеты.
   */
  async generateReports(): Promise<void> {
    this.logger.log('Generating portfolio reports');

    // Получаем уникальных пользователей
    const userIds = await this.assetsRepository
      .createQueryBuilder('asset')
      .select('DISTINCT asset.userId', 'userId')
      .getRawMany();

    for (const { userId } of userIds) {
      try {
        await this.generateUserReport(userId);
      } catch (error) {
        this.logger.error(`Error generating report for user ${userId}: ${error.message}`);
      }
    }
  }

  /**
   * Генерация отчета для конкретного пользователя.
   *
   * @param userId ID пользователя
   */
  private async generateUserReport(userId: number): Promise<void> {
    const assets = await this.assetsRepository.find({
      where: { userId },
      relations: ['user'],
    });

    if (assets.length === 0 || !assets[0].user) return;

    const user = assets[0].user;

    // Находим активы с резкими изменениями (более 5% за день)
    const significantChanges = assets.filter((asset) => {
      const dailyChange = Math.abs(asset.dailyChange || 0);
      return dailyChange >= 5; // Порог для отчета
    });

    if (significantChanges.length === 0) {
      this.logger.log(`No significant changes for user ${userId}, skipping report`);
      return;
    }

    const reportData = this.buildReportData(significantChanges);
    const subject = 'Portfolio Report: Significant Price Changes';
    const message = this.buildReportMessage(reportData);

    const success = await this.emailService.sendEmail(user.email, subject, message);

    // Логируем отправку
    await this.logRepository.save({
      userId,
      type: 'report',
      subject,
      message,
      sentAt: new Date(),
      status: success ? 'sent' : 'failed',
    });

    if (success) {
      this.logger.log(`Report sent to user ${userId}`);
    } else {
      this.logger.error(`Failed to send report to user ${userId}`);
    }
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
    dailyChange: number;
    weeklyChange: number;
    totalValue: number;
  }> {
    return assets.map((asset) => {
      const name = asset instanceof CryptoAsset ? asset.symbol : (asset as NFTAsset).collectionName;
      const currentPrice =
        asset instanceof CryptoAsset ? asset.currentPrice : (asset as NFTAsset).floorPrice;
      const totalValue = asset.amount * currentPrice;

      return {
        name,
        type: asset instanceof CryptoAsset ? 'Crypto' : 'NFT',
        currentPrice,
        dailyChange: asset.dailyChange || 0,
        weeklyChange: asset.weeklyChange || 0,
        totalValue,
      };
    });
  }

  /**
   * Построение сообщения отчета.
   *
   * @param reportData Данные отчета
   * @returns Текст сообщения
   */
  private buildReportMessage(
    reportData: Array<{
      name: string;
      type: string;
      currentPrice: number;
      dailyChange: number;
      weeklyChange: number;
      totalValue: number;
    }>,
  ): string {
    let message = 'Portfolio Report - Assets with Significant Price Changes:\n\n';

    let totalPortfolioValue = 0;

    for (const item of reportData) {
      message += `${item.type}: ${item.name}\n`;
      message += `  Current Price: $${item.currentPrice.toFixed(2)}\n`;
      message += `  Daily Change: ${item.dailyChange.toFixed(2)}%\n`;
      message += `  Weekly Change: ${item.weeklyChange.toFixed(2)}%\n`;
      message += `  Total Value: $${item.totalValue.toFixed(2)}\n\n`;

      totalPortfolioValue += item.totalValue;
    }

    message += `Total Portfolio Value (significant changes): $${totalPortfolioValue.toFixed(2)}\n\n`;
    message += 'Please review your investments and consider your strategy.';

    return message;
  }
}
