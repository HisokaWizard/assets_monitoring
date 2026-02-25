/**
 * @fileoverview Базовый API клиент.
 *
 * Конфигурация RTK Query для работы с backend API.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

/**
 * Базовый URL backend API.
 */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  })(args, api, extraOptions);

  if (result.error?.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }

  return result;
};

/**
 * Базовый API клиент.
 *
 * Настроен с baseUrl и автоматической подстановкой JWT токена.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['UserSettings', 'NotificationSettings', 'Assets'],
  endpoints: () => ({}),
});
