/**
 * @fileoverview Хук для выполнения регистрации.
 *
 * Обрабатывает register с обработкой ошибок и состояния загрузки.
 */

import { useCallback } from 'react';
import { useRegisterMutation } from '../../../shared/api/auth';
import { RegisterDto, RegisterResponse } from '../../../shared/api/auth/types';

interface UseRegisterReturn {
  /**
   * Функция для выполнения регистрации.
   */
  register: (data: RegisterDto) => Promise<RegisterResponse>;

  /**
   * Флаг загрузки.
   */
  isLoading: boolean;

  /**
   * Ошибка регистрации.
   */
  error: Error | null;
}

/**
 * Хук для выполнения регистрации пользователя.
 *
 * @returns Объект с register функцией, isLoading и error
 */
export const useRegister = (): UseRegisterReturn => {
  const [registerMutation, { isLoading, error }] = useRegisterMutation();

  const register = useCallback(
    async (data: RegisterDto): Promise<RegisterResponse> => {
      const result = await registerMutation(data).unwrap();
      return result;
    },
    [registerMutation]
  );

  return {
    register,
    isLoading,
    error: error as Error | null,
  };
};
