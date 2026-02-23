/**
 * @fileoverview Хук для управления настройками профиля.
 *
 * Инкапсулирует логику работы с API и состоянием.
 */

import { useCallback } from 'react';
import {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
  UpdateUserSettingsDto,
} from '../../../entities/user-settings';
import {
  useGetNotificationSettingsQuery,
  useCreateNotificationSettingsMutation,
  useUpdateNotificationSettingsMutation,
  AssetType,
  UpdateNotificationSettingsDto,
} from '../../../entities/notification-settings';

/**
 * Возвращаемый тип хука.
 */
export interface UseProfileSettingsResult {
  // User settings
  userSettings: ReturnType<typeof useGetUserSettingsQuery>;
  updateUserSettings: (data: UpdateUserSettingsDto) => Promise<void>;

  // Notification settings
  notificationSettings: ReturnType<typeof useGetNotificationSettingsQuery>;
  createNotificationSettings: (assetType: AssetType) => Promise<void>;
  updateNotificationSettings: (id: number, data: UpdateNotificationSettingsDto) => Promise<void>;
}

/**
 * Хук для управления настройками профиля.
 */
export const useProfileSettings = (): UseProfileSettingsResult => {
  const userSettings = useGetUserSettingsQuery();
  const notificationSettings = useGetNotificationSettingsQuery();

  const [updateUserSettingsMutation] = useUpdateUserSettingsMutation();
  const [createNotificationSettingsMutation] = useCreateNotificationSettingsMutation();
  const [updateNotificationSettingsMutation] = useUpdateNotificationSettingsMutation();

  const updateUserSettings = useCallback(async (data: UpdateUserSettingsDto) => {
    await updateUserSettingsMutation(data).unwrap();
  }, [updateUserSettingsMutation]);

  const createNotificationSettings = useCallback(async (assetType: AssetType) => {
    await createNotificationSettingsMutation({ assetType }).unwrap();
  }, [createNotificationSettingsMutation]);

  const updateNotificationSettings = useCallback(async (id: number, data: UpdateNotificationSettingsDto) => {
    await updateNotificationSettingsMutation({ id, data }).unwrap();
  }, [updateNotificationSettingsMutation]);

  return {
    userSettings,
    updateUserSettings,
    notificationSettings,
    createNotificationSettings,
    updateNotificationSettings,
  };
};
