/**
 * @fileoverview Модуль уведомлений.
 *
 * Этот файл определяет модуль для функциональности уведомлений.
 * Группирует контроллер и сервис для отправки уведомлений.
 *
 * Модули позволяют организовывать код в логические блоки
 * и управлять зависимостями между компонентами.
 */

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AssetsModule } from '../assets/assets.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { SchedulerService } from './scheduler.service';
import { NotificationSettings } from './notification-settings.entity';
import { NotificationLog } from './notification-log.entity';
import { HistoricalPrice } from '../assets/historical-price.entity';
import { User } from '../auth/user.entity';

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
  imports: [
    TypeOrmModule.forFeature([NotificationSettings, NotificationLog, HistoricalPrice, User]),
    ScheduleModule.forRoot(),
    HttpModule,
    forwardRef(() => AssetsModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationService, EmailService, SchedulerService],
  exports: [NotificationService, EmailService, SchedulerService],
})
export class NotificationsModule {}
