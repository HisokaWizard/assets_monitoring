/**
 * @fileoverview Модуль для планирования задач.
 *
 * Этот модуль предоставляет SchedulerService для cron задач.
 */

import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

/**
 * Модуль планировщика.
 *
 * Экспортирует SchedulerService для использования в других модулях.
 * Зависимости (AssetsModule, NotificationService) предоставляются через
 * NotificationsModule, который импортирует этот модуль.
 */
@Module({
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
