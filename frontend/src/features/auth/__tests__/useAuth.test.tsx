import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../hooks/useAuth';
import { authReducer } from '../model/authSlice';

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState,
  });
};

const renderWithProvider = (
  hook: () => ReturnType<typeof useAuth>,
  preloadedState = {}
) => {
  const store = createTestStore(preloadedState as { auth: any });

  const { result } = renderHook(hook, {
    wrapper: ({ children }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });

  return { result, store };
};

describe('useAuth', () => {
  it('should return isAuthenticated as false when not logged in', () => {
    const { result } = renderWithProvider(() => useAuth(), {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
      },
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('should return isAuthenticated as true when logged in', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'user' as const,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    const { result } = renderWithProvider(() => useAuth(), {
      auth: {
        isAuthenticated: true,
        user: mockUser,
        token: 'test-token-123',
      },
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('test-token-123');
  });

  it('should return user data correctly', () => {
    const mockUser = {
      id: 42,
      email: 'admin@example.com',
      role: 'admin' as const,
      createdAt: '2023-06-15',
      updatedAt: '2024-03-20',
    };

    const { result } = renderWithProvider(() => useAuth(), {
      auth: {
        isAuthenticated: true,
        user: mockUser,
        token: 'admin-token',
      },
    });

    expect(result.current.user?.id).toBe(42);
    expect(result.current.user?.email).toBe('admin@example.com');
    expect(result.current.user?.role).toBe('admin');
  });
});
