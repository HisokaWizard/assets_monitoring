/**
 * @fileoverview Базовый API клиент.
 *
 * Конфигурация RTK Query для работы с backend API.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Базовый URL backend API.
 */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Базовый API клиент.
 *
 * Настроен с baseUrl и автоматической подстановкой JWT токена.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
});
