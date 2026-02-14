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
import { EmailService } from './email/email.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { NotificationSettings } from './core/entities/notification-settings.entity';
import { NotificationLog } from './core/entities/notification-log.entity';
import { HistoricalPrice } from '../assets/historical-price.entity';
import { Asset } from '../assets/asset.entity';
import { User } from '../auth/user.entity';
import { EmailModule } from './email/email.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AlertsModule } from './alerts/alerts.module';
import { AlertsService } from './alerts/alerts.service';
import { ReportsModule } from './reports/reports.module';
import { ReportsService } from './reports/reports.service';

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
    TypeOrmModule.forFeature([NotificationSettings, NotificationLog, HistoricalPrice, Asset, User]),
    ScheduleModule.forRoot(),
    HttpModule,
    forwardRef(() => AssetsModule),
    EmailModule,
    SchedulerModule,
    AlertsModule,
    ReportsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationService, EmailService, AlertsService, ReportsService, SchedulerService],
  exports: [NotificationService, EmailService, AlertsService, ReportsService, SchedulerService],
})
export class NotificationsModule {}
