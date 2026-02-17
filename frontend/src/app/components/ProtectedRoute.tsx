/**
 * @fileoverview ProtectedRoute компонент.
 *
 * Компонент для защиты маршрутов, требующих аутентификации.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../providers/store';
import { selectIsAuthenticated } from '../../features/auth/model/selectors';

/**
 * ProtectedRoute компонент.
 *
 * Перенаправляет неавторизованных пользователей на страницу входа.
 * Авторизованные пользователи получают доступ к дочерним маршрутам.
 */
export const ProtectedRoute = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
