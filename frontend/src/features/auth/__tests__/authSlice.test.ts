import { authSlice, setCredentials, logout } from '../model/authSlice';
import { AuthState } from '../model/types';

describe('authSlice', () => {
  const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };

  describe('setCredentials', () => {
    it('should set credentials and authenticate user', () => {
      const payload = {
        token: 'test-token-123',
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'user' as const,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      const state = authSlice.reducer(initialState, setCredentials(payload));

      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('test-token-123');
      expect(state.user).toEqual(payload.user);
    });

    it('should set token in localStorage', () => {
      const payload = {
        token: 'test-token',
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'user' as const,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      authSlice.reducer(initialState, setCredentials(payload));

      expect(localStorage.getItem('access_token')).toBe('test-token');
    });
  });

  describe('logout', () => {
    it('should clear authentication state', () => {
      const authenticatedState: AuthState = {
        isAuthenticated: true,
        token: 'test-token',
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'user' as const,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      const state = authSlice.reducer(authenticatedState, logout());

      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
    });

    it('should remove token from localStorage', () => {
      localStorage.setItem('access_token', 'test-token');

      authSlice.reducer(
        {
          isAuthenticated: true,
          token: 'test-token',
          user: null,
        },
        logout()
      );

      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(initialState.isAuthenticated).toBe(false);
      expect(initialState.user).toBeNull();
      expect(initialState.token).toBeNull();
    });
  });
});
