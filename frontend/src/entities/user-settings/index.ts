/**
 * @fileoverview Public API для сущности user-settings.
 *
 * Экспортирует типы, хуки и API.
 */

export type {
  UserSettings,
  CreateUserSettingsDto,
  UpdateUserSettingsDto,
} from './model/types';

export {
  userSettingsApi,
  useGetUserSettingsQuery,
  useCreateUserSettingsMutation,
  useUpdateUserSettingsMutation,
} from './model/userSettingsApi';
