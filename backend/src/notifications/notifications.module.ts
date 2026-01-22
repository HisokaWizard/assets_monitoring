/**
 * @fileoverview Модуль уведомлений.
 *
 * Этот файл определяет модуль для функциональности уведомлений.
 * Группирует контроллер и сервис для отправки уведомлений.
 *
 * Модули позволяют организовывать код в логические блоки
 * и управлять зависимостями между компонентами.
 */

import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

/**
 * Модуль уведомлений.
 *
 * Организует компоненты для работы с уведомлениями:
 * контроллер для API endpoints и сервис для бизнес-логики.
 *
 * @Module декоратор определяет:
 * - controllers: контроллеры для обработки HTTP запросов
 * - providers: сервисы для dependency injection
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
