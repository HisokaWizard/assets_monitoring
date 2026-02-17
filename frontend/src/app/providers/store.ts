/**
 * @fileoverview Redux store.
 *
 * Конфигурация глобального состояния приложения.
 */

import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../../shared/api/base';
import { authReducer } from '../../features/auth/model';

/**
 * Глобальный Redux store.
 */
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

/**
 * Тип корневого состояния.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Тип dispatch.
 */
export type AppDispatch = typeof store.dispatch;
