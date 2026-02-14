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
 */
@Module({
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
