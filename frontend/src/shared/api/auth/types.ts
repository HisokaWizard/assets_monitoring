/**
 * @fileoverview Типы для API аутентификации.
 *
 * DTO для запросов и ответов auth endpoints.
 */

import { User } from '../../../entities/user/model/types';

/**
 * DTO для входа пользователя.
 *
 * Данные, необходимые для аутентификации.
 */
export interface LoginDto {
  /**
   * Email пользователя.
   */
  email: string;

  /**
   * Пароль пользователя.
   */
  password: string;
}

/**
 * DTO для регистрации пользователя.
 *
 * Данные, необходимые для создания нового аккаунта.
 */
export interface RegisterDto {
  /**
   * Email пользователя.
   */
  email: string;

  /**
   * Пароль пользователя (минимум 6 символов).
   */
  password: string;

  /**
   * Роль пользователя ('user' | 'admin').
   */
  role: string;
}

/**
 * Ответ при успешном входе.
 *
 * Содержит JWT токен доступа.
 */
export interface LoginResponse {
  /**
   * JWT токен для авторизации.
   */
  access_token: string;
}

/**
 * Ответ при успешной регистрации.
 *
 * Содержит данные созданного пользователя.
 */
export type RegisterResponse = User;

/**
 * Объединенный тип ответа auth.
 */
export type AuthResponse = LoginResponse | RegisterResponse;
