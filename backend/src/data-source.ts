/**
 * @fileoverview Конфигурация DataSource для TypeORM CLI.
 *
 * Используется для запуска миграций через CLI-команды:
 * - npm run migration:generate
 * - npm run migration:run
 * - npm run migration:revert
 *
 * Загружает переменные окружения через dotenv.
 * Entities и migrations указаны через glob-паттерны для автоматического обнаружения.
 */

import "dotenv/config";
import { DataSource } from "typeorm";

/**
 * DataSource для TypeORM CLI.
 *
 * synchronize отключён — схема управляется только через миграции.
 */
export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DB_DATABASE || "database.sqlite",
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/database/migrations/*.ts"],
  migrationsTableName: "migrations",
  synchronize: false,
});
