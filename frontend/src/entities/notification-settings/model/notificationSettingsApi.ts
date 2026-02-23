/**
 * @fileoverview RTK Query API для настроек уведомлений.
 *
 * Предоставляет endpoints для управления настройками мониторинга.
 */

import { baseApi } from '../../../shared/api/base';
import {
  NotificationSettings,
  CreateNotificationSettingsDto,
  UpdateNotificationSettingsDto,
} from './types';

/**
 * API для настроек уведомлений.
 *
 * Endpoints:
 * - getNotificationSettings: GET /notifications/settings
 * - createNotificationSettings: POST /notifications/settings
 * - updateNotificationSettings: PUT /notifications/settings/:id
 * - deleteNotificationSettings: DELETE /notifications/settings/:id
 */
export const notificationSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationSettings: builder.query<NotificationSettings[], void>({
      query: () => ({
        url: '/notifications/settings',
        method: 'GET',
      }),
      providesTags: ['NotificationSettings'],
    }),

    createNotificationSettings: builder.mutation<NotificationSettings, CreateNotificationSettingsDto>({
      query: (data) => ({
        url: '/notifications/settings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['NotificationSettings'],
    }),

    updateNotificationSettings: builder.mutation<NotificationSettings, { id: number; data: UpdateNotificationSettingsDto }>({
      query: ({ id, data }) => ({
        url: `/notifications/settings/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['NotificationSettings'],
    }),

    deleteNotificationSettings: builder.mutation<{ deleted: boolean }, number>({
      query: (id) => ({
        url: `/notifications/settings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NotificationSettings'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationSettingsQuery,
  useCreateNotificationSettingsMutation,
  useUpdateNotificationSettingsMutation,
  useDeleteNotificationSettingsMutation,
} = notificationSettingsApi;
