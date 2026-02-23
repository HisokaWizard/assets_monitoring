/**
 * @fileoverview Компонент информации о пользователе.
 *
 * Отображает email, роль и дату создания аккаунта.
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

/**
 * Props для компонента UserInfo.
 */
export interface UserInfoProps {
  /**
   * Email пользователя.
   */
  email: string;

  /**
   * Роль пользователя.
   */
  role: string;

  /**
   * Дата создания аккаунта.
   */
  createdAt: string;
}

/**
 * Компонент отображения информации о пользователе.
 */
export const UserInfo: React.FC<UserInfoProps> = ({ email, role, createdAt }) => {
  const formattedDate = new Date(createdAt).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AccountCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body1">{email}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip
            label={role.toUpperCase()}
            color={role === 'admin' ? 'secondary' : 'primary'}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="body2" color="text.secondary">
            Created: {formattedDate}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
