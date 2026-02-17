/**
 * @fileoverview Конфигурация роутера приложения.
 *
 * Определяет все маршруты приложения.
 */

import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../../pages/home';
import { LoginPage } from '../../pages/login';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <div>404 - Page Not Found</div>,
  },
]);
