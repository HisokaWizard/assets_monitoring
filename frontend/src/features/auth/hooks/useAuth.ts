/**
 * @fileoverview Хук для доступа к состоянию аутентификации.
 *
 * Предоставляет удобный доступ к данным auth.
 */

import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser, selectToken } from '../model/selectors';

/**
 * Хук для работы с состоянием аутентификации.
 *
 * @returns Объект с isAuthenticated, user, token
 */
export const useAuth = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);

  return {
    isAuthenticated,
    user,
    token,
  };
};
