/**
 * @fileoverview Модуль аутентификации.
 *
 * Этот файл определяет модуль для функциональности аутентификации и авторизации.
 * Группирует контроллер, сервис, стратегию JWT и репозиторий пользователей.
 *
 * Настраивает Passport для JWT стратегии и JwtModule для генерации токенов.
 */

import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { User } from "./user.entity";
import { UserRepository } from "./user.repository";

/**
 * Модуль аутентификации.
 *
 * Организует компоненты для регистрации, входа и JWT аутентификации.
 * Настраивает необходимые модули для работы с пользователями и токенами.
 *
 * @Module декоратор определяет:
 * - imports: зависимые модули (TypeORM для User, Passport, JWT)
 * - controllers: контроллер для API endpoints
 * - providers: сервисы и стратегии для dependency injection
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserRepository],
  exports: [UserRepository],
})
export class AuthModule implements OnModuleInit {
  /**
   * Инициализация модуля.
   *
   * Проверяет наличие обязательной переменной окружения JWT_SECRET
   * при старте приложения. Без неё приложение не может безопасно работать.
   */
  async onModuleInit(): Promise<void> {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "FATAL: JWT_SECRET environment variable is not set. " +
          "Application cannot start without secure JWT secret.",
      );
    }
  }
}
