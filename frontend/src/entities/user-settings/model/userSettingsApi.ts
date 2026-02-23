/**
 * @fileoverview RTK Query API для настроек пользователя.
 *
 * Предоставляет endpoints для управления API ключами пользователя.
 */

import { baseApi } from '../../../shared/api/base';
import {
  UserSettings,
  CreateUserSettingsDto,
  UpdateUserSettingsDto,
} from './types';

/**
 * API для настроек пользователя.
 *
 * Endpoints:
 * - getUserSettings: GET /user-settings
 * - createUserSettings: POST /user-settings
 * - updateUserSettings: PATCH /user-settings
 */
export const userSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserSettings: builder.query<UserSettings | null, void>({
      query: () => ({
        url: '/user-settings',
        method: 'GET',
      }),
      providesTags: ['UserSettings'],
    }),

    createUserSettings: builder.mutation<UserSettings, CreateUserSettingsDto>({
      query: (data) => ({
        url: '/user-settings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UserSettings'],
    }),

    updateUserSettings: builder.mutation<UserSettings, UpdateUserSettingsDto>({
      query: (data) => ({
        url: '/user-settings',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['UserSettings'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserSettingsQuery,
  useCreateUserSettingsMutation,
  useUpdateUserSettingsMutation,
} = userSettingsApi;
