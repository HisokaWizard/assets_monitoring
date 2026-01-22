/**
 * @fileoverview Модуль аутентификации.
 *
 * Этот файл определяет модуль для функциональности аутентификации и авторизации.
 * Группирует контроллер, сервис, стратегию JWT и репозиторий пользователей.
 *
 * Настраивает Passport для JWT стратегии и JwtModule для генерации токенов.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';

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
      secret: 'secret', // Use env
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
