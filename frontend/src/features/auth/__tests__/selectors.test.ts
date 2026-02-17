import { RootState } from '../../../app/providers/store';
import {
  selectIsAuthenticated,
  selectUser,
  selectToken,
} from '../model/selectors';

describe('auth selectors', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'user' as const,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const authenticatedState: RootState = {
    auth: {
      isAuthenticated: true,
      user: mockUser,
      token: 'test-token-123',
    },
    api: {
      mutations: {},
      queries: {},
      provided: {},
    },
  } as RootState;

  const unauthenticatedState: RootState = {
    auth: {
      isAuthenticated: false,
      user: null,
      token: null,
    },
    api: {
      mutations: {},
      queries: {},
      provided: {},
    },
  } as RootState;

  describe('selectIsAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      expect(selectIsAuthenticated(authenticatedState)).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      expect(selectIsAuthenticated(unauthenticatedState)).toBe(false);
    });
  });

  describe('selectUser', () => {
    it('should return user data when user is authenticated', () => {
      expect(selectUser(authenticatedState)).toEqual(mockUser);
    });

    it('should return null when user is not authenticated', () => {
      expect(selectUser(unauthenticatedState)).toBeNull();
    });
  });

  describe('selectToken', () => {
    it('should return token when user is authenticated', () => {
      expect(selectToken(authenticatedState)).toBe('test-token-123');
    });

    it('should return null when user is not authenticated', () => {
      expect(selectToken(unauthenticatedState)).toBeNull();
    });
  });
});
