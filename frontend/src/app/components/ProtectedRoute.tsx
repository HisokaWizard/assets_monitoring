/**
 * @fileoverview ProtectedRoute компонент.
 *
 * Компонент для защиты маршрутов, требующих аутентификации.
 */

import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../providers/store';
import { selectIsAuthenticated, selectIsAuthLoading } from '../../features/auth/model/selectors';
import { useMeQuery } from '../../shared/api/auth/authApi';
import { setCredentials } from '../../features/auth/model/authSlice';

/**
 * ProtectedRoute компонент.
 *
 * Перенаправляет неавторизованных пользователей на страницу входа.
 * Авторизованные пользователи получают доступ к дочерним маршрутам.
 */
export const ProtectedRoute = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsAuthLoading);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const token = localStorage.getItem('access_token');

  const { data: user, isLoading: isMeLoading } = useMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (token && user && !isMeLoading) {
      dispatch(setCredentials({ token, user }));
    }
  }, [user, isMeLoading, dispatch, token]);

  const isAuthenticating = !token ? false : isMeLoading;

  if (isAuthenticating || isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
