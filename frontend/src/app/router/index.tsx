/**
 * @fileoverview Конфигурация роутера приложения.
 *
 * Определяет все маршруты приложения.
 */

import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../../pages/home';
import { LoginPage } from '../../pages/login';
import { RegisterPage } from '../../pages/register';
import { NftsPage } from '../../pages/nfts';
import { TokensPage } from '../../pages/tokens';
import { ProfilePage } from '../../pages/profile';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/nfts',
        element: <NftsPage />,
      },
      {
        path: '/tokens',
        element: <TokensPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '*',
    element: <div>404 - Page Not Found</div>,
  },
]);
