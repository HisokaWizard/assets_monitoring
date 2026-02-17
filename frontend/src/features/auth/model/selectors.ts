/**
 * @fileoverview Селекторы для auth slice.
 *
 * Функции для получения данных из состояния аутентификации.
 */

import { RootState } from '../../../app/providers/store';

/**
 * Получение состояния аутентификации.
 */
export const selectIsAuthenticated = (state: RootState): boolean =>
  state.auth.isAuthenticated;

/**
 * Получение данных текущего пользователя.
 */
export const selectUser = (state: RootState) => state.auth.user;

/**
 * Получение JWT токена.
 */
export const selectToken = (state: RootState): string | null =>
  state.auth.token;
