/**
 * @fileoverview JWT стратегия аутентификации.
 *
 * Этот файл реализует стратегию Passport для валидации JWT токенов.
 * Стратегии в NestJS используются для аутентификации пользователей
 * на основе различных методов (JWT, локальная аутентификация и т.д.).
 *
 * @Injectable декоратор регистрирует класс как провайдер.
 * PassportStrategy(Strategy) наследует базовую функциональность Passport.
 */

import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "./user.entity";
import { UserRole } from "./user-role.enum";

/**
 * Интерфейс JWT payload.
 *
 * Описывает структуру данных, хранящихся в JWT токене.
 * Поле role типизировано как UserRole для основных сценариев,
 * но принимает string для обратной совместимости с внешними токенами.
 */
export interface JwtPayload {
  /** Email пользователя. */
  email: string;
  /** Идентификатор пользователя (subject). */
  sub: number;
  /** Роль пользователя в системе. */
  role: UserRole | string;
}

/**
 * JWT стратегия для аутентификации.
 *
 * Валидирует JWT токены из заголовков Authorization.
 * Извлекает payload токена и возвращает объект пользователя.
 *
 * @Injectable делает класс доступным для dependency injection.
 * Extends PassportStrategy для интеграции с Passport.js.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Конструктор стратегии.
   *
   * Настраивает параметры валидации JWT:
   * - Извлечение токена из заголовка Authorization как Bearer token
   * - Проверка срока действия токена
   * - Секретный ключ для подписи (в продакшене использовать переменные окружения)
   */
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * Валидация payload JWT токена.
   *
   * Вызывается Passport после успешной валидации токена.
   * Преобразует payload в объект User для использования в guards и контроллерах.
   *
   * @param payload Декодированный payload JWT токена (типизирован как JwtPayload).
   * @returns Promise с объектом пользователя (без пароля для безопасности).
   */
  async validate(payload: JwtPayload): Promise<Partial<User>> {
    return {
      id: payload.sub,
      email: payload.email,
      password: "",
      role: payload.role as UserRole,
      lastUpdated: undefined,
    };
  }
}
