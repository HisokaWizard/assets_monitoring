/**
 * @fileoverview Модуль для отправки email.
 *
 * Этот модуль предоставляет EmailService для отправки уведомлений.
 */

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Модуль email.
 *
 * Экспортирует EmailService для использования в других модулях.
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
