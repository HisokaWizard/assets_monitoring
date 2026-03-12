/**
 * @fileoverview Модуль для генерации отчетов.
 *
 * Этот модуль предоставляет ReportsService для генерации периодических отчетов.
 */

import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationLog } from "../core/entities/notification-log.entity";
import { Asset, CryptoAsset, NFTAsset } from "../../assets/asset.entity";
import { HistoricalPrice } from "../../assets/historical-price.entity";
import { EmailModule } from "../email/email.module";
import { ReportsService } from "./reports.service";
import { ReportLog } from "./report-log.entity";
import { AssetsModule } from "../../assets/assets.module";

/**
 * Модуль отчетов.
 *
 * Предоставляет ReportsService для генерации периодических отчетов
 * и отправки их пользователям.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationLog,
      ReportLog,
      Asset,
      CryptoAsset,
      NFTAsset,
      HistoricalPrice,
    ]),
    EmailModule,
    forwardRef(() => AssetsModule),
  ],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
