import { renderHook, act } from '@testing-library/react';
import { useRegister } from '../hooks/useRegister';
import * as authApiModule from '../../../shared/api/auth/authApi';

jest.mock('../../../shared/api/auth/authApi', () => ({
  useRegisterMutation: jest.fn(),
}));

const mockUseRegisterMutation = authApiModule.useRegisterMutation as jest.MockedFunction<
  typeof authApiModule.useRegisterMutation
>;

describe('useRegister', () => {
  let mockRegisterMutation: jest.Mock;

  beforeEach(() => {
    mockRegisterMutation = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        id: 1,
        email: 'new@example.com',
        role: 'user',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }),
    });
    mockUseRegisterMutation.mockReturnValue([
      mockRegisterMutation,
      { isLoading: false, error: null },
    ] as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return register function, isLoading and error', () => {
    const { result } = renderHook(() => useRegister());

    expect(result.current.register).toBeDefined();
    expect(typeof result.current.register).toBe('function');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should call register mutation with correct data', async () => {
    const { result } = renderHook(() => useRegister());

    let returnedData: any;
    await act(async () => {
      returnedData = await result.current.register({
        email: 'new@example.com',
        password: 'password123',
        role: 'user',
      });
    });

    expect(mockRegisterMutation).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      role: 'user',
    });

    expect(returnedData).toEqual({
      id: 1,
      email: 'new@example.com',
      role: 'user',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });
  });

  it('should handle registration error', async () => {
    const mockError = new Error('Email already exists');
    mockRegisterMutation.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(mockError),
    } as any);

    mockUseRegisterMutation.mockReturnValue([
      mockRegisterMutation,
      { isLoading: false, error: mockError },
    ] as any);

    const { result } = renderHook(() => useRegister());

    await act(async () => {
      try {
        await result.current.register({
          email: 'existing@example.com',
          password: 'password123',
          role: 'user',
        });
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should allow admin role registration', async () => {
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.register({
        email: 'admin@example.com',
        password: 'adminpass123',
        role: 'admin',
      });
    });

    expect(mockRegisterMutation).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'adminpass123',
      role: 'admin',
    });
  });
});
