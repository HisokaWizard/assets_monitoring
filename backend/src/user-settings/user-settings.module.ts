/**
 * @fileoverview Модуль настроек пользователя.
 *
 * Группирует компоненты для работы с API-ключами пользователя:
 * controller, service и entity.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSettingsController } from './user-settings.controller';
import { UserSettingsService } from './user-settings.service';
import { UserSettings } from './core/entities/user-settings.entity';

/**
 * Модуль настроек пользователя.
 *
 * @Module декоратор определяет:
 * - imports: импортируемые модули (TypeOrmModule для entity)
 * - controllers: контроллеры для обработки HTTP запросов
 * - providers: сервисы для dependency injection
 * - exports: экспортируемые провайдеры (если нужны в других модулях)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSettings]),
  ],
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}
