/**
 * @fileoverview Сервис для генерации периодических отчетов.
 *
 * Этот файл содержит логику для создания отчетов по портфелю
 * с расчетом изменений цен за различные периоды.
 *
 * feat_8: Добавлены:
 *  - HTML-шаблон отчёта (buildReportHtml) по аналогии с alerts
 *  - Проверка наличия исторических данных (hasEnoughHistory) перед отправкой
 *  - Учёт уникальности отчётов (canSendReport) через таблицу report_log
 */

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationLog } from "../core/entities/notification-log.entity";
import { ReportLog } from "./report-log.entity";
import { Asset, CryptoAsset, NFTAsset } from "../../assets/asset.entity";
import { HistoricalPrice } from "../../assets/historical-price.entity";
import { EmailService } from "../email/email.service";

/**
 * Данные одного актива для отчёта.
 */
interface ReportItem {
  /** Тип актива: crypto или nft */
  assetType: "crypto" | "nft";
  /** Основное название: symbol для crypto, collectionName для nft */
  name: string;
  /** Полное название криптовалюты (только для crypto) */
  fullName?: string;
  /** Символ нативного токена (только для nft) */
  nativeToken?: string;
  /** Цена в начале периода (null если первый отчёт — нет снапшота) */
  lastPrice: number | null;
  /** Текущая цена */
  currentPrice: number;
  /** % изменения (число) */
  change: number;
  /** Общая стоимость позиции */
  totalValue: number;
}

/**
 * Минимальный возраст исторических данных для каждого периода (в мс).
 */
const PERIOD_MIN_AGE_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  quarterly: 90 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Подписи периодов для заголовка отчёта.
 */
const PERIOD_LABELS: Record<string, string> = {
  daily: "Daily report — last 24 hours",
  weekly: "Weekly report — last 7 days",
  monthly: "Monthly report — last 30 days",
  quarterly: "Quarterly report — last 90 days",
  yearly: "Yearly report — last 365 days",
};

/**
 * Сервис для отчетов.
 *
 * Генерирует периодические отчеты (daily, weekly, monthly, quarterly, yearly)
 * и отправляет их пользователям по email.
 *
 * Перед отправкой проверяет:
 *  1. Наличие достаточных исторических данных (hasEnoughHistory).
 *  2. Уникальность — не отправляет повторно, пока не истёк период (canSendReport).
 *
 * @Injectable регистрирует класс как провайдер в контейнере зависимостей.
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(ReportLog)
    private readonly reportLogRepository: Repository<ReportLog>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    @InjectRepository(HistoricalPrice)
    private readonly historicalPriceRepository: Repository<HistoricalPrice>,
    private readonly emailService: EmailService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Публичные методы
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Генерация отчета для конкретного пользователя.
   *
   * @param userId ID пользователя
   * @param period Период отчета ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
   */
  async generateUserReport(userId: number, period: string): Promise<void> {
    this.logger.log(`Generating ${period} report for user ${userId}`);
    await this.generateUserPeriodicReport(userId, period);
  }

  /**
   * Генерация периодических отчетов для всех пользователей.
   *
   * @param period Период отчета ('daily', 'weekly', etc.)
   */
  async generatePeriodicReports(period: string): Promise<void> {
    this.logger.log(`Generating ${period} reports`);

    const userIds = await this.assetsRepository
      .createQueryBuilder("asset")
      .select("DISTINCT asset.userId", "userId")
      .getRawMany();

    for (const { userId } of userIds) {
      try {
        await this.generateUserPeriodicReport(userId, period);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Error generating ${period} report for user ${userId}: ${message}`,
        );
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Приватные методы — бизнес-логика
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Генерация периодического отчета для конкретного пользователя.
   *
   * Алгоритм:
   *  1. Проверяем наличие исторических данных достаточной глубины.
   *  2. Проверяем, что с момента последнего отчёта прошёл полный период.
   *  3. Строим данные отчёта по активам.
   *  4. Отправляем HTML-письмо.
   *  5. Сохраняем запись в ReportLog.
   *
   * @param userId ID пользователя
   * @param period Период отчета
   */
  private async generateUserPeriodicReport(
    userId: number,
    period: string,
  ): Promise<void> {
    // sub_task_2: Проверка исторических данных
    const hasHistory = await this.hasEnoughHistory(userId, period);
    if (!hasHistory) {
      this.logger.log(
        `Not enough historical data for ${period} report, user ${userId} — skipping`,
      );
      return;
    }

    // sub_task_3: Проверка уникальности (кулдаун)
    const canSend = await this.canSendReport(userId, period);
    if (!canSend) {
      this.logger.log(
        `${period} report already sent recently for user ${userId} — skipping`,
      );
      return;
    }

    const assets = await this.assetsRepository.find({
      where: { userId },
      relations: ["user"],
    });

    if (assets.length === 0 || !assets[0].user) return;

    const user = assets[0].user;
    const reportItems: ReportItem[] = [];

    for (const asset of assets) {
      const lastPrice = this.getLastPriceForPeriod(asset, period);
      const currentPrice = this.getCurrentPrice(asset);

      if (!currentPrice) continue;

      let change = 0;
      if (lastPrice !== null && lastPrice !== 0) {
        change = ((currentPrice - lastPrice) / lastPrice) * 100;
      }

      // Обновляем снапшот цены начала периода
      this.setLastPriceForPeriod(asset, period, currentPrice);

      const isCrypto = asset instanceof CryptoAsset;
      const name = isCrypto
        ? (asset as CryptoAsset).symbol
        : (asset as NFTAsset).collectionName;
      const totalValue = asset.amount * currentPrice;

      reportItems.push({
        assetType: isCrypto ? "crypto" : "nft",
        name,
        fullName: isCrypto ? (asset as CryptoAsset).fullName : undefined,
        nativeToken: !isCrypto ? (asset as NFTAsset).nativeToken : undefined,
        lastPrice,
        currentPrice,
        change,
        totalValue,
      });
    }

    if (reportItems.length === 0) {
      this.logger.warn(`No valid assets with prices for user ${userId}`);
      return;
    }

    // Сохраняем обновленные снапшоты активов
    await this.assetsRepository.save(assets);

    await this.sendReportEmail(user, period, reportItems);
  }

  /**
   * Отправка email с отчетом.
   *
   * Отправляет письмо с HTML-таблицей и plain-text fallback.
   * После успешной отправки сохраняет запись в ReportLog.
   *
   * @param user Пользователь
   * @param period Период отчета
   * @param reportItems Данные отчёта
   */
  private async sendReportEmail(
    user: { id: number; email: string },
    period: string,
    reportItems: ReportItem[],
  ): Promise<void> {
    const periodTitle = period.charAt(0).toUpperCase() + period.slice(1);
    const subject = `Portfolio ${periodTitle} Report`;
    const plainText = this.buildReportMessage(reportItems, period);
    const html = this.buildReportHtml(reportItems, period);

    const success = await this.emailService.sendEmail(
      user.email,
      subject,
      plainText,
      html,
    );

    // Логируем в NotificationLog (общий аудит-лог)
    await this.logRepository.save({
      userId: user.id,
      type: "report",
      subject,
      message: plainText,
      sentAt: new Date(),
      status: success ? "sent" : "failed",
    });

    if (success) {
      this.logger.log(`Report sent to user ${user.id}`);
      // sub_task_3: Сохраняем в ReportLog только при успехе
      // Это позволяет повторить отправку если письмо не дошло
      await this.reportLogRepository.save({
        userId: user.id,
        period,
        sentAt: new Date(),
        status: "sent",
      });
    } else {
      this.logger.error(`Failed to send report to user ${user.id}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // sub_task_2: Проверка исторических данных
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Проверяет наличие достаточных исторических данных для генерации отчёта.
   *
   * Отчёт имеет смысл только если в historical_price есть хотя бы одна запись,
   * созданная раньше минимального порога периода. Это гарантирует, что
   * «цена N дней назад» будет реальной, а не нулём или заглушкой.
   *
   * Пороги:
   *  - daily:     ≥ 24ч назад
   *  - weekly:    ≥ 7д назад
   *  - monthly:   ≥ 30д назад
   *  - quarterly: ≥ 90д назад
   *  - yearly:    ≥ 365д назад
   *
   * @param userId ID пользователя
   * @param period Период отчёта
   * @returns true если данных достаточно
   */
  private async hasEnoughHistory(
    userId: number,
    period: string,
  ): Promise<boolean> {
    const minAge = this.getPeriodMinAge(period);
    const threshold = new Date(Date.now() - minAge);

    const count = await this.historicalPriceRepository
      .createQueryBuilder("hp")
      .innerJoin("hp.asset", "asset")
      .where("asset.userId = :userId", { userId })
      .andWhere("hp.timestamp <= :threshold", { threshold })
      .getCount();

    return count > 0;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // sub_task_3: Проверка уникальности отчётов
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Проверяет, можно ли отправить отчёт за данный период.
   *
   * Блокирует повторную отправку, пока с момента последнего успешного
   * отчёта не прошёл полный период:
   *  - daily:     24ч
   *  - weekly:    7 суток
   *  - monthly:   30 суток
   *  - quarterly: 90 суток
   *  - yearly:    365 суток
   *
   * Первый отчёт (нет записей в ReportLog) всегда разрешён.
   *
   * @param userId ID пользователя
   * @param period Период отчёта
   * @returns true если отправка разрешена
   */
  private async canSendReport(
    userId: number,
    period: string,
  ): Promise<boolean> {
    const lastReport = await this.reportLogRepository.findOne({
      where: { userId, period },
      order: { sentAt: "DESC" },
    });

    if (!lastReport) return true;

    const minAge = this.getPeriodMinAge(period);
    const elapsed = Date.now() - new Date(lastReport.sentAt).getTime();
    return elapsed >= minAge;
  }

  /**
   * Возвращает минимальный возраст исторических данных для периода (в мс).
   *
   * @param period Период отчёта
   * @returns Количество миллисекунд
   */
  private getPeriodMinAge(period: string): number {
    return PERIOD_MIN_AGE_MS[period] ?? PERIOD_MIN_AGE_MS.daily;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // sub_task_4: HTML-шаблон отчёта
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Построение HTML-шаблона периодического отчёта.
   *
   * Единый шаблон для всех 5 периодов (daily, weekly, monthly, quarterly, yearly).
   * Табличная форма по аналогии с buildAlertHtml() в alerts.service.ts.
   *
   * Колонки таблицы:
   *  Type | Asset | Price [period] ago | Current Price | Change
   *
   * Форматирование цен:
   *  - crypto: $50,000.00
   *  - nft: 12.5 ETH (нативный токен)
   *
   * Цвет % изменения:
   *  - зелёный при росте (≥ 0)
   *  - красный при падении (< 0)
   *
   * @param reportItems Список активов для отчёта
   * @param period Период отчёта
   * @returns HTML-строка письма
   */
  private buildReportHtml(reportItems: ReportItem[], period: string): string {
    const periodTitle = period.charAt(0).toUpperCase() + period.slice(1);
    const periodLabel = PERIOD_LABELS[period] ?? `${periodTitle} report`;

    const rows = reportItems
      .map((item) => {
        const isPositive = item.change >= 0;
        const changeColor = isPositive ? "green" : "red";
        const changeFormatted =
          (isPositive ? "+" : "") + item.change.toFixed(2) + "%";

        const typeBadge = item.assetType.toUpperCase();

        // Название актива: crypto — symbol + fullName, nft — collectionName + nativeToken
        const nameCell =
          item.assetType === "crypto"
            ? `<strong>${item.name}</strong>${item.fullName ? `<br><small style="color:#666;">${item.fullName}</small>` : ""}`
            : `<strong>${item.name}</strong>${item.nativeToken ? `<br><small style="color:#666;">${item.nativeToken}</small>` : ""}`;

        // Форматирование цены
        const pricePrefix = item.assetType === "crypto" ? "$" : "";
        const priceSuffix =
          item.assetType === "nft" && item.nativeToken
            ? ` ${item.nativeToken}`
            : "";
        const formatPrice = (price: number | null): string => {
          if (price === null) return '<span style="color:#aaa;">N/A</span>';
          return `${pricePrefix}${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}${priceSuffix}`;
        };

        return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 14px; font-size: 12px; font-weight: bold; color: #555; white-space: nowrap;">${typeBadge}</td>
          <td style="padding: 10px 14px; font-size: 14px;">${nameCell}</td>
          <td style="padding: 10px 14px; font-size: 14px; white-space: nowrap; color: #888;">${formatPrice(item.lastPrice)}</td>
          <td style="padding: 10px 14px; font-size: 14px; white-space: nowrap;">${formatPrice(item.currentPrice)}</td>
          <td style="padding: 10px 14px; font-size: 15px; font-weight: bold; color: ${changeColor}; white-space: nowrap;">${changeFormatted}</td>
        </tr>`;
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio ${periodTitle} Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1a3a5c; padding: 20px 24px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">
                Portfolio ${periodTitle} Report
              </h1>
              <p style="margin: 6px 0 0; color: #a8c4e0; font-size: 13px;">
                ${periodLabel}
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
                    <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e0e0e0;">Current Price</th>
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
                Please review your investments and consider your strategy.
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

  // ──────────────────────────────────────────────────────────────────────────
  // Вспомогательные методы
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Получение цены-снапшота начала периода из полей актива.
   *
   * @param asset Актив
   * @param period Период
   * @returns Цена или null если снапшота ещё нет
   */
  private getLastPriceForPeriod(asset: Asset, period: string): number | null {
    switch (period) {
      case "daily":
        return asset.dailyPrice ?? null;
      case "weekly":
        return asset.weeklyPrice ?? null;
      case "monthly":
        return asset.monthlyPrice ?? null;
      case "quarterly":
        return asset.quartPrice ?? null;
      case "yearly":
        return asset.yearPrice ?? null;
      default:
        return asset.dailyPrice ?? null;
    }
  }

  /**
   * Обновление цены-снапшота начала следующего периода.
   *
   * @param asset Актив
   * @param period Период
   * @param price Текущая цена
   */
  private setLastPriceForPeriod(
    asset: Asset,
    period: string,
    price: number,
  ): void {
    switch (period) {
      case "daily":
        asset.dailyPrice = price;
        break;
      case "weekly":
        asset.weeklyPrice = price;
        break;
      case "monthly":
        asset.monthlyPrice = price;
        break;
      case "quarterly":
        asset.quartPrice = price;
        break;
      case "yearly":
        asset.yearPrice = price;
        break;
      default:
        asset.dailyPrice = price;
        break;
    }
  }

  /**
   * Получение текущей рыночной цены актива.
   *
   * @param asset Актив
   * @returns Текущая цена или null
   */
  private getCurrentPrice(asset: Asset): number | null {
    if (asset.type === "crypto") {
      return (asset as CryptoAsset).currentPrice || null;
    } else if (asset.type === "nft") {
      return (asset as NFTAsset).floorPrice || null;
    }
    return null;
  }

  /**
   * Построение plain-text сообщения отчёта (для fallback и логов).
   *
   * @param reportItems Данные отчёта
   * @param period Период
   * @returns Текст сообщения
   */
  private buildReportMessage(
    reportItems: ReportItem[],
    period: string,
  ): string {
    const periodTitle = period.charAt(0).toUpperCase() + period.slice(1);

    if (!reportItems || reportItems.length === 0) {
      return `Portfolio ${periodTitle} Report\n\nNo assets with valid prices to report.`;
    }

    let message = `Portfolio ${periodTitle} Report - All Assets:\n\n`;
    let totalPortfolioValue = 0;

    for (const item of reportItems) {
      const price = item.currentPrice ?? 0;
      const change = item.change ?? 0;
      const value = item.totalValue ?? 0;
      const lastPriceStr =
        item.lastPrice !== null ? `$${item.lastPrice.toFixed(2)}` : "N/A";

      message += `${item.assetType === "crypto" ? "Crypto" : "NFT"}: ${item.name}\n`;
      message += `  Price Before: ${lastPriceStr}\n`;
      message += `  Current Price: $${price.toFixed(2)}\n`;
      message += `  Change: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%\n\n`;

      totalPortfolioValue += value;
    }

    message += `Total Portfolio Value: $${totalPortfolioValue.toFixed(2)}\n\n`;
    message += "Please review your investments and consider your strategy.";

    return message;
  }
}
