/**
 * @fileoverview Модуль для работы с алертами.
 *
 * Этот модуль предоставляет AlertsService для проверки ценовых алертов.
 */

import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationSettings } from "../core/entities/notification-settings.entity";
import { NotificationLog } from "../core/entities/notification-log.entity";
import { Asset, CryptoAsset, NFTAsset } from "../../assets/asset.entity";
import { EmailModule } from "../email/email.module";
import { AlertsService } from "./alerts.service";
import { NotificationSettingsRepository } from "../core/notification-settings.repository";
import { NotificationLogRepository } from "../core/notification-log.repository";
import { AssetsModule } from "../../assets/assets.module";

/**
 * Модуль алертов.
 *
 * Предоставляет AlertsService для проверки ценовых алертов
 * и отправки уведомлений пользователям.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationSettings,
      NotificationLog,
      Asset,
      CryptoAsset,
      NFTAsset,
    ]),
    EmailModule,
    forwardRef(() => AssetsModule),
  ],
  providers: [
    AlertsService,
    NotificationSettingsRepository,
    NotificationLogRepository,
  ],
  exports: [AlertsService],
})
export class AlertsModule {}
