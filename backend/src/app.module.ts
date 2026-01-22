/**
 * @fileoverview Корневой модуль приложения NestJS.
 *
 * Этот файл определяет главный модуль приложения, который объединяет все другие модули
 * и настраивает глобальные зависимости, такие как база данных TypeORM.
 * В NestJS модули - это контейнеры для организации кода, они группируют связанные компоненты
 * (контроллеры, сервисы, провайдеры) и управляют их зависимостями через dependency injection.
 *
 * Декоратор @Module определяет метаданные модуля: импорты (другие модули или конфигурации),
 * контроллеры (обработчики HTTP запросов), провайдеры (сервисы, репозитории и т.д.).
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from './assets/assets.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Asset } from './assets/asset.entity';
import { User } from './auth/user.entity';

/**
 * Корневой модуль приложения.
 *
 * Импортирует модули для активов, аутентификации и уведомлений,
 * а также настраивает TypeORM для работы с базой данных SQLite.
 * В продакшене следует использовать миграции вместо synchronize.
 *
 * @Module декоратор регистрирует модуль в контейнере зависимостей NestJS,
 * позволяя другим частям приложения использовать его компоненты.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Asset, User],
      synchronize: true, // For development; use migrations in production
    }),
    AssetsModule,
    AuthModule,
    NotificationsModule,
  ],
})
export class AppModule {}
