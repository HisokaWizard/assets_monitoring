/**
 * @fileoverview Точка входа в приложение NestJS.
 *
 * Этот файл отвечает за инициализацию и запуск сервера NestJS.
 * Он создает экземпляр приложения на основе корневого модуля AppModule,
 * настраивает CORS для взаимодействия с фронтендом,
 * подключает Swagger/OpenAPI документацию и запускает сервер на порту 7777.
 *
 * NestJS - это фреймворк для Node.js, построенный на принципах модульной архитектуры,
 * dependency injection и декораторов. Он позволяет создавать масштабируемые серверные приложения.
 */

import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

/**
 * Настраивает Swagger/OpenAPI документацию для приложения.
 *
 * Создает конфигурацию документации с помощью DocumentBuilder,
 * генерирует OpenAPI-документ и подключает Swagger UI по адресу /api/docs.
 *
 * @param app - Экземпляр NestJS приложения (INestApplication).
 */
function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Assets Monitoring API")
    .setDescription("API для мониторинга криптовалютных активов и NFT")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Аутентификация и авторизация")
    .addTag("assets", "Управление криптовалютными активами и NFT")
    .addTag("notifications", "Уведомления и алерты")
    .addTag("user-settings", "Пользовательские настройки")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);
}

/**
 * Функция запуска приложения.
 *
 * Создает экземпляр NestJS приложения с использованием AppModule,
 * включает CORS для обработки запросов от фронтенда,
 * настраивает глобальную валидацию, подключает Swagger документацию
 * и запускает сервер на порту 7777.
 *
 * @returns {Promise<void>} Промис, который разрешается после успешного запуска сервера.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors();

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger/OpenAPI documentation (after pipes, before listen)
  setupSwagger(app);

  await app.listen(7777);
}

bootstrap();
