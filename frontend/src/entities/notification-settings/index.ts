/**
 * @fileoverview Public API для сущности notification-settings.
 *
 * Экспортирует типы, хуки, API и селекторы.
 */

export type {
  NotificationSettings,
  AssetType,
  CreateNotificationSettingsDto,
  UpdateNotificationSettingsDto,
} from './model/types';

export { selectSettingsByAssetType } from './model/types';

export {
  notificationSettingsApi,
  useGetNotificationSettingsQuery,
  useCreateNotificationSettingsMutation,
  useUpdateNotificationSettingsMutation,
  useDeleteNotificationSettingsMutation,
} from './model/notificationSettingsApi';
