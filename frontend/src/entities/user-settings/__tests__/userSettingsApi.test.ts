import { userSettingsApi } from '../model/userSettingsApi';

describe('userSettingsApi', () => {
  describe('endpoints', () => {
    it('should have getUserSettings endpoint defined', () => {
      expect(userSettingsApi.endpoints.getUserSettings).toBeDefined();
    });

    it('should have createUserSettings endpoint defined', () => {
      expect(userSettingsApi.endpoints.createUserSettings).toBeDefined();
    });

    it('should have updateUserSettings endpoint defined', () => {
      expect(userSettingsApi.endpoints.updateUserSettings).toBeDefined();
    });
  });

  describe('hooks generation', () => {
    it('should generate useGetUserSettingsQuery hook', () => {
      expect(userSettingsApi.useGetUserSettingsQuery).toBeDefined();
      expect(typeof userSettingsApi.useGetUserSettingsQuery).toBe('function');
    });

    it('should generate useCreateUserSettingsMutation hook', () => {
      expect(userSettingsApi.useCreateUserSettingsMutation).toBeDefined();
      expect(typeof userSettingsApi.useCreateUserSettingsMutation).toBe('function');
    });

    it('should generate useUpdateUserSettingsMutation hook', () => {
      expect(userSettingsApi.useUpdateUserSettingsMutation).toBeDefined();
      expect(typeof userSettingsApi.useUpdateUserSettingsMutation).toBe('function');
    });
  });

  describe('baseApi integration', () => {
    it('should have userSettingsApi defined', () => {
      expect(userSettingsApi).toBeDefined();
    });

    it('should have endpoints with correct names', () => {
      const endpoints = userSettingsApi.endpoints;
      expect('getUserSettings' in endpoints).toBe(true);
      expect('createUserSettings' in endpoints).toBe(true);
      expect('updateUserSettings' in endpoints).toBe(true);
    });
  });
});
