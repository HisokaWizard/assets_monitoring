/**
 * @fileoverview Точка входа для фичи авторизации.
 *
 * Реэкспорт всех публичных API фичи auth.
 */

// Types
export type {
  AuthState,
  SetCredentialsPayload,
} from './model';

// Slice
export {
  authSlice,
  authReducer,
  setCredentials,
  logout,
} from './model';

// Selectors
export {
  selectIsAuthenticated,
  selectUser,
  selectToken,
} from './model';

// Hooks
export {
  useAuth,
  useLogin,
  useRegister,
} from './hooks';
