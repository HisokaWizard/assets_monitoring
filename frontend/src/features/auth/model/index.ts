/**
 * @fileoverview Точка входа для auth модели.
 *
 * Реэкспорт типов, slice и селекторов.
 */

export type { AuthState, SetCredentialsPayload } from './types';
export { authSlice, authReducer, setCredentials, logout } from './authSlice';
export { selectIsAuthenticated, selectUser, selectToken } from './selectors';
