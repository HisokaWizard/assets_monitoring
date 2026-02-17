/**
 * @fileoverview Интерфейсы auth API.
 *
 * Реэкспорт типов для удобного импорта.
 */

export type {
  LoginDto,
  RegisterDto,
  LoginResponse,
  RegisterResponse,
  AuthResponse,
} from './types';

export { authApi, useLoginMutation, useRegisterMutation } from './authApi';
