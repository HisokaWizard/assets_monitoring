/**
 * @fileoverview Модуль для генерации отчетов.
 *
 * Этот модуль предоставляет ReportsService для генерации периодических отчетов.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationLog } from '../core/entities/notification-log.entity';
import { Asset } from '../../assets/asset.entity';
import { EmailModule } from '../email/email.module';
import { ReportsService } from './reports.service';

/**
 * Модуль отчетов.
 *
 * Предоставляет ReportsService для генерации периодических отчетов
 * и отправки их пользователям.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog, Asset]),
    EmailModule,
  ],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
