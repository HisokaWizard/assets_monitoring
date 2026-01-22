/**
 * @fileoverview Модуль для функциональности активов.
 *
 * Этот файл определяет модуль активов, который группирует связанные компоненты:
 * контроллер для обработки HTTP запросов, сервис для бизнес-логики
 * и репозиторий для работы с базой данных.
 *
 * Модули в NestJS - это фундаментальные строительные блоки приложения,
 * которые организуют код в логические группы и управляют зависимостями.
 * @Module декоратор определяет метаданные модуля.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { AssetUpdateService } from './asset-update.service';
import { Asset } from './asset.entity';

/**
 * Модуль активов.
 *
 * Организует компоненты для работы с активами: контроллер для API,
 * сервис для логики и репозиторий для данных.
 *
 * @Module декоратор регистрирует модуль с его компонентами:
 * - imports: другие модули или конфигурации (здесь TypeOrmModule для Asset)
 * - controllers: контроллеры для обработки HTTP запросов
 * - providers: сервисы и другие провайдеры для dependency injection
 */
@Module({
  imports: [TypeOrmModule.forFeature([Asset]), HttpModule],
  controllers: [AssetsController],
  providers: [AssetsService, AssetUpdateService],
})
export class AssetsModule {}
