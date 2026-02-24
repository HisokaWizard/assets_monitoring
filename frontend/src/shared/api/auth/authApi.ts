/**
 * @fileoverview API аутентификации.
 *
 * RTK Query endpoints для login и register.
 */

import { baseApi } from '../base';
import { LoginDto, RegisterDto, LoginResponse, RegisterResponse } from './types';

interface MeResponse {
  id: number;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

/**
 * API аутентификации.
 *
 * Предоставляет endpoints для входа и регистрации.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Получить текущего пользователя.
     */
    me: builder.query<MeResponse, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
    }),

    /**
     * Вход пользователя в систему.
     *
     * @param credentials - email и password
     * @returns JWT токен
     */
    login: builder.mutation<LoginResponse, LoginDto>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    /**
     * Регистрация нового пользователя.
     *
     * @param data - email, password и role
     * @returns Данные созданного пользователя
     */
    register: builder.mutation<RegisterResponse, RegisterDto>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useMeQuery } = authApi;

/**
 * Хук для выполнения входа.
 */
export const { useLoginMutation } = authApi;

/**
 * Хук для выполнения регистрации.
 */
export const { useRegisterMutation } = authApi;
