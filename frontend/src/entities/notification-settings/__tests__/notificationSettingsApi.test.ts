import { notificationSettingsApi } from '../model/notificationSettingsApi';
import { selectSettingsByAssetType } from '../model/types';
import { NotificationSettings } from '../model/types';

describe('notificationSettingsApi', () => {
  describe('endpoints', () => {
    it('should have getNotificationSettings endpoint defined', () => {
      expect(notificationSettingsApi.endpoints.getNotificationSettings).toBeDefined();
    });

    it('should have createNotificationSettings endpoint defined', () => {
      expect(notificationSettingsApi.endpoints.createNotificationSettings).toBeDefined();
    });

    it('should have updateNotificationSettings endpoint defined', () => {
      expect(notificationSettingsApi.endpoints.updateNotificationSettings).toBeDefined();
    });

    it('should have deleteNotificationSettings endpoint defined', () => {
      expect(notificationSettingsApi.endpoints.deleteNotificationSettings).toBeDefined();
    });
  });

  describe('hooks generation', () => {
    it('should generate useGetNotificationSettingsQuery hook', () => {
      expect(notificationSettingsApi.useGetNotificationSettingsQuery).toBeDefined();
      expect(typeof notificationSettingsApi.useGetNotificationSettingsQuery).toBe('function');
    });

    it('should generate useCreateNotificationSettingsMutation hook', () => {
      expect(notificationSettingsApi.useCreateNotificationSettingsMutation).toBeDefined();
      expect(typeof notificationSettingsApi.useCreateNotificationSettingsMutation).toBe('function');
    });

    it('should generate useUpdateNotificationSettingsMutation hook', () => {
      expect(notificationSettingsApi.useUpdateNotificationSettingsMutation).toBeDefined();
      expect(typeof notificationSettingsApi.useUpdateNotificationSettingsMutation).toBe('function');
    });

    it('should generate useDeleteNotificationSettingsMutation hook', () => {
      expect(notificationSettingsApi.useDeleteNotificationSettingsMutation).toBeDefined();
      expect(typeof notificationSettingsApi.useDeleteNotificationSettingsMutation).toBe('function');
    });
  });
});

describe('selectSettingsByAssetType', () => {
  const mockSettings: NotificationSettings[] = [
    {
      id: 1,
      userId: 1,
      assetType: 'crypto',
      enabled: true,
      thresholdPercent: 10,
      intervalHours: 4,
      updateIntervalHours: 4,
    },
    {
      id: 2,
      userId: 1,
      assetType: 'nft',
      enabled: false,
      thresholdPercent: 15,
      intervalHours: 6,
      updateIntervalHours: 6,
    },
  ];

  it('should return crypto settings', () => {
    const result = selectSettingsByAssetType(mockSettings, 'crypto');
    expect(result).toBeDefined();
    expect(result?.assetType).toBe('crypto');
  });

  it('should return nft settings', () => {
    const result = selectSettingsByAssetType(mockSettings, 'nft');
    expect(result).toBeDefined();
    expect(result?.assetType).toBe('nft');
  });

  it('should return undefined for missing assetType', () => {
    const result = selectSettingsByAssetType(mockSettings, 'stocks' as any);
    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined settings', () => {
    const result = selectSettingsByAssetType(undefined, 'crypto');
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    const result = selectSettingsByAssetType([], 'crypto');
    expect(result).toBeUndefined();
  });
});
