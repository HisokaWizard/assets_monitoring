/* eslint-disable @typescript-eslint/no-var-requires */
import { renderHook } from '@testing-library/react';
import * as authApiModule from '../../../shared/api/auth/authApi';

jest.mock('../../../shared/api/auth/authApi', () => ({
  useLoginMutation: jest.fn(() => [
    jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ access_token: 'test-token-123' }),
    }),
    { isLoading: false, error: null },
  ]),
}));

const mockUseLoginMutation = authApiModule.useLoginMutation as jest.MockedFunction<
  typeof authApiModule.useLoginMutation
>;

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

describe('useLogin', () => {
  let mockLoginMutation: jest.Mock;

  beforeEach(() => {
    mockDispatch.mockClear();
    mockLoginMutation = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ access_token: 'test-token-123' }),
    });
    mockUseLoginMutation.mockReturnValue([
      mockLoginMutation,
      { isLoading: false, error: null },
    ] as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return login function', () => {
    const { useLogin } = require('../hooks/useLogin');
    const { result } = renderHook(() => useLogin());

    expect(result.current.login).toBeDefined();
    expect(typeof result.current.login).toBe('function');
  });

  it('should return isLoading from mutation', () => {
    const { useLogin } = require('../hooks/useLogin');
    const { result } = renderHook(() => useLogin());

    expect(result.current.isLoading).toBe(false);
  });

  it('should return error from mutation', () => {
    const { useLogin } = require('../hooks/useLogin');
    const { result } = renderHook(() => useLogin());

    expect(result.current.error).toBeNull();
  });
});
