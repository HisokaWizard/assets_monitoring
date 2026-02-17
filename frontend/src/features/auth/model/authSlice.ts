/**
 * @fileoverview Redux slice для аутентификации.
 *
 * Управление состоянием авторизации пользователя.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, SetCredentialsPayload } from './types';
import { authApi } from '../../../shared/api/auth/authApi';

/**
 * Начальное состояние аутентификации.
 * Проверяем localStorage на наличие токена при инициализации.
 */
const getInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      return {
        isAuthenticated: true,
        user: null,
        token,
      };
    }
  }
  return {
    isAuthenticated: false,
    user: null,
    token: null,
  };
};

const initialState: AuthState = getInitialState();

/**
 * Slice для управления аутентификацией.
 */
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Установка учетных данных пользователя.
     *
     * @param state - текущее состояние
     * @param action - payload с токеном и пользователем
     */
    setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', token);
    },

    /**
     * Выход пользователя из системы.
     *
     * Очищает состояние и localStorage.
     */
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
    },
  },
  extraReducers: (builder) => {
    /**
     * Обработка успешного входа через API.
     */
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.token = payload.access_token;
        state.isAuthenticated = true;
        localStorage.setItem('access_token', payload.access_token);
      }
    );

    /**
     * Обработка успешной регистрации через API.
     */
    builder.addMatcher(
      authApi.endpoints.register.matchFulfilled,
      (state, { payload }) => {
        state.user = payload;
      }
    );
  },
});

/**
 * Экшен для установки учетных данных.
 */
export const { setCredentials, logout } = authSlice.actions;

/**
 * Редьюсер аутентификации.
 */
export const authReducer = authSlice.reducer;
