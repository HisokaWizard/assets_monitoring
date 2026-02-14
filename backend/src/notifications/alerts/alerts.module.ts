/**
 * @fileoverview Модуль для работы с алертами.
 *
 * Этот модуль предоставляет AlertsService для проверки ценовых алертов.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSettings } from '../core/entities/notification-settings.entity';
import { NotificationLog } from '../core/entities/notification-log.entity';
import { Asset } from '../../assets/asset.entity';
import { EmailModule } from '../email/email.module';
import { AlertsService } from './alerts.service';

/**
 * Модуль алертов.
 *
 * Предоставляет AlertsService для проверки ценовых алертов
 * и отправки уведомлений пользователям.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSettings, NotificationLog, Asset]),
    EmailModule,
  ],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
