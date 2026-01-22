/**
 * @fileoverview Точка входа в приложение NestJS.
 *
 * Этот файл отвечает за инициализацию и запуск сервера NestJS.
 * Он создает экземпляр приложения на основе корневого модуля AppModule,
 * настраивает CORS для взаимодействия с фронтендом и запускает сервер на порту 3000.
 *
 * NestJS - это фреймворк для Node.js, построенный на принципах модульной архитектуры,
 * dependency injection и декораторов. Он позволяет создавать масштабируемые серверные приложения.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Функция запуска приложения.
 *
 * Создает экземпляр NestJS приложения с использованием AppModule,
 * включает CORS для обработки запросов от фронтенда,
 * и запускает сервер на порту 3000.
 *
 * @returns {Promise<void>} Промис, который разрешается после успешного запуска сервера.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors();

  await app.listen(3000);
}

bootstrap();
