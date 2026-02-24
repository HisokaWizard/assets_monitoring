/**
 * @fileoverview Точка входа для auth модели.
 *
 * Реэкспорт типов, slice и селекторов.
 */

export type { AuthState, SetCredentialsPayload } from './types';
export { authSlice, authReducer, setCredentials, logout, setAuthLoading } from './authSlice';
export { selectIsAuthenticated, selectIsAuthLoading, selectUser, selectToken } from './selectors';
