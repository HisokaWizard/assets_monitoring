/**
 * @fileoverview Страница профиля пользователя.
 *
 * Отображает информацию о пользователе, API ключи и настройки мониторинга.
 */

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
} from '@mui/material';
import { useAppSelector } from '../../app/providers/store';
import { selectUser } from '../../features/auth/model/selectors';
import {
  UserInfo,
  ApiKeysForm,
  MonitoringSettingsForm,
  useProfileSettings,
} from '../../features/profile-settings';

/**
 * Страница профиля пользователя.
 */
export const ProfilePage: React.FC = () => {
  const user = useAppSelector(selectUser);
  const {
    userSettings,
    updateUserSettings,
    notificationSettings,
    createNotificationSettings,
    updateNotificationSettings,
  } = useProfileSettings();

  const isLoading = userSettings.isLoading || notificationSettings.isLoading;
  const error = userSettings.error || notificationSettings.error;

  const hasApiKeys = Boolean(
    userSettings.data?.coinmarketcapApiKey || userSettings.data?.openseaApiKey
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Profile
        </Typography>

        {!user ? (
          <Alert severity="error">User not found. Please log in again.</Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Failed to load settings. Please try again.
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <UserInfo
                  email={user.email}
                  role={user.role}
                  createdAt={user.createdAt}
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <ApiKeysForm
                  initialData={userSettings.data}
                  onSubmit={updateUserSettings}
                  isLoading={userSettings.isLoading}
                />

                {!hasApiKeys && (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    Для работы системы мониторинга активов необходимо сохранить API ключи CoinMarketCap и/или OpenSea. 
                    Без них обновление цен и уведомления работать не будут.
                  </Alert>
                )}

                <Box sx={{ mt: 3 }}>
                  <MonitoringSettingsForm
                    settings={notificationSettings.data}
                    onUpdate={updateNotificationSettings}
                    onCreate={createNotificationSettings}
                    isLoading={isLoading}
                  />
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
};
