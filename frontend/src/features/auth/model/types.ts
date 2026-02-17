/**
 * @fileoverview Типы для фичи авторизации.
 *
 * Состояние и типы для управления аутентификацией.
 */

import { User } from '../../../entities/user/model/types';

/**
 * Состояние аутентификации в Redux.
 */
export interface AuthState {
  /**
   * Флаг аутентификации пользователя.
   */
  isAuthenticated: boolean;

  /**
   * Данные текущего пользователя.
   */
  user: User | null;

  /**
   * JWT токен доступа.
   */
  token: string | null;
}

/**
 * Payload для установки учетных данных.
 */
export interface SetCredentialsPayload {
  /**
   * JWT токен.
   */
  token: string;

  /**
   * Данные пользователя.
   */
  user: User;
}
