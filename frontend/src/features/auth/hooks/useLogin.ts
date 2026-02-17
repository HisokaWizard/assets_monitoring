/**
 * @fileoverview Хук для выполнения входа.
 *
 * Обрабатывает login с обработкой ошибок и состояния загрузки.
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../../shared/api/auth';
import { setCredentials } from '../model/authSlice';
import { LoginDto } from '../../../shared/api/auth/types';

interface UseLoginReturn {
  /**
   * Функция для выполнения входа.
   */
  login: (credentials: LoginDto) => Promise<void>;

  /**
   * Флаг загрузки.
   */
  isLoading: boolean;

  /**
   * Ошибка входа.
   */
  error: Error | null;
}

/**
 * Хук для выполнения входа пользователя.
 *
 * @returns Объект с login функцией, isLoading и error
 */
export const useLogin = (): UseLoginReturn => {
  const dispatch = useDispatch();
  const [loginMutation, { isLoading, error }] = useLoginMutation();

  const login = useCallback(
    async (credentials: LoginDto) => {
      const result = await loginMutation(credentials).unwrap();
      // После успешного входа получаем данные пользователя через токен
      // или сразу устанавливаем токен
      dispatch(setCredentials({
        token: result.access_token,
        user: { id: 0, email: credentials.email, role: 'user', createdAt: '', updatedAt: '' },
      }));
    },
    [loginMutation, dispatch]
  );

  return {
    login,
    isLoading,
    error: error as Error | null,
  };
};
