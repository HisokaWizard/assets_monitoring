import { authApi } from '../auth/authApi';

describe('authApi', () => {
  describe('login endpoint', () => {
    it('should have login endpoint defined', () => {
      expect(authApi.endpoints.login).toBeDefined();
    });
  });

  describe('register endpoint', () => {
    it('should have register endpoint defined', () => {
      expect(authApi.endpoints.register).toBeDefined();
    });
  });

  describe('hooks generation', () => {
    it('should generate useLoginMutation hook', () => {
      expect(authApi.useLoginMutation).toBeDefined();
      expect(typeof authApi.useLoginMutation).toBe('function');
    });

    it('should generate useRegisterMutation hook', () => {
      expect(authApi.useRegisterMutation).toBeDefined();
      expect(typeof authApi.useRegisterMutation).toBe('function');
    });
  });

  describe('baseApi integration', () => {
    it('should have authApi injected into baseApi', () => {
      expect(authApi).toBeDefined();
      expect(authApi.injectEndpoints).toBeDefined();
    });

    it('should have endpoints with correct names', () => {
      const endpoints = authApi.endpoints;
      expect('login' in endpoints).toBe(true);
      expect('register' in endpoints).toBe(true);
    });
  });
});
