/**
 * @fileoverview Первая миграция — создание всех таблиц схемы БД.
 *
 * Создаёт таблицы для всех существующих entities:
 * - user — пользователи системы
 * - asset — базовая таблица активов (STI: crypto / nft)
 * - historical_price — история цен активов
 * - notification_settings — настройки уведомлений
 * - notification_log — логи отправленных уведомлений
 * - report_log — логи периодических отчётов
 * - user_settings — API-ключи пользователей
 *
 * Стратегия наследования: Single Table Inheritance (STI) для Asset.
 * TypeORM с SQLite использует STI через колонку-дискриминатор "type".
 */

import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Миграция InitialSchema — создание полной схемы БД.
 */
export class InitialSchema1741500000000 implements MigrationInterface {
  name = "InitialSchema1741500000000";

  /**
   * Применяет миграцию: создаёт все таблицы.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Таблица user
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "email" varchar NOT NULL,
        "password" varchar NOT NULL,
        "role" text NOT NULL DEFAULT ('user'),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "lastUpdated" datetime,
        CONSTRAINT "UQ_user_email" UNIQUE ("email")
      )
    `);

    // 2. Таблица asset (STI: колонка "type" как дискриминатор)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "type" varchar,
        "amount" decimal NOT NULL,
        "middlePrice" decimal NOT NULL,
        "previousPrice" decimal NOT NULL,
        "multiple" decimal NOT NULL,
        "dailyChange" decimal NOT NULL,
        "weeklyChange" decimal NOT NULL,
        "monthlyChange" decimal NOT NULL,
        "quartChange" decimal NOT NULL,
        "yearChange" decimal NOT NULL,
        "totalChange" decimal NOT NULL,
        "dailyChangeUsd" decimal DEFAULT (0),
        "weeklyChangeUsd" decimal DEFAULT (0),
        "monthlyChangeUsd" decimal DEFAULT (0),
        "quartChangeUsd" decimal DEFAULT (0),
        "yearChangeUsd" decimal DEFAULT (0),
        "totalChangeUsd" decimal DEFAULT (0),
        "dailyPrice" decimal,
        "dailyTimestamp" datetime,
        "weeklyPrice" decimal,
        "weeklyTimestamp" datetime,
        "monthlyPrice" decimal,
        "monthlyTimestamp" datetime,
        "quartPrice" decimal,
        "quartTimestamp" datetime,
        "yearPrice" decimal,
        "yearTimestamp" datetime,
        "userId" integer NOT NULL,
        "symbol" varchar,
        "fullName" varchar,
        "currentPrice" decimal,
        "collectionName" varchar,
        "nativeToken" varchar,
        "floorPrice" decimal,
        "floorPriceUsd" decimal,
        "middlePriceUsd" decimal,
        "traitPrice" decimal,
        CONSTRAINT "FK_asset_userId" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 3. Таблица historical_price
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historical_price" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "assetId" integer NOT NULL,
        "price" decimal NOT NULL,
        "timestamp" datetime NOT NULL,
        "source" varchar NOT NULL DEFAULT ('API'),
        CONSTRAINT "FK_historical_price_assetId" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // 4. Таблица notification_settings
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_settings" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" integer NOT NULL,
        "assetType" varchar NOT NULL,
        "enabled" boolean NOT NULL DEFAULT (1),
        "thresholdPercent" decimal NOT NULL DEFAULT (10),
        "intervalHours" integer NOT NULL DEFAULT (4),
        "updateIntervalHours" integer NOT NULL DEFAULT (4),
        "lastNotified" datetime,
        CONSTRAINT "FK_notification_settings_userId" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 5. Таблица notification_log
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_log" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" integer NOT NULL,
        "type" varchar NOT NULL,
        "subject" varchar NOT NULL,
        "message" text NOT NULL,
        "sentAt" datetime NOT NULL,
        "status" varchar NOT NULL DEFAULT ('sent'),
        CONSTRAINT "FK_notification_log_userId" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 6. Таблица report_log
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "report_log" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" integer NOT NULL,
        "period" varchar NOT NULL,
        "sentAt" datetime NOT NULL,
        "status" varchar NOT NULL DEFAULT ('sent'),
        CONSTRAINT "FK_report_log_userId" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 7. Таблица user_settings
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_settings" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" integer NOT NULL,
        "coinmarketcapApiKey" varchar(500),
        "openseaApiKey" varchar(500),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_user_settings_userId" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  /**
   * Откатывает миграцию: удаляет все таблицы в обратном порядке.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "historical_price"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asset"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}
