/**
 * @fileoverview Форма для управления API ключами.
 *
 * Позволяет редактировать ключи CoinMarketCap и OpenSea.
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import {
  UserSettings,
  UpdateUserSettingsDto,
} from '../../../entities/user-settings';

/**
 * Props для компонента ApiKeysForm.
 */
export interface ApiKeysFormProps {
  /**
   * Существующие настройки.
   */
  initialData?: UserSettings | null;

  /**
   * Callback для сохранения.
   */
  onSubmit: (data: UpdateUserSettingsDto) => Promise<void>;

  /**
   * Флаг загрузки.
   */
  isLoading?: boolean;
}

/**
 * Маскирует API ключ для отображения.
 */
const maskApiKey = (key: string | undefined): string => {
  if (!key) return '';
  if (key.length <= 8) return '********';
  return key.slice(0, 4) + '****' + key.slice(-4);
};

/**
 * Форма для управления API ключами.
 */
export const ApiKeysForm: React.FC<ApiKeysFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [coinmarketcapKey, setCoinmarketcapKey] = useState('');
  const [openseaKey, setOpenseaKey] = useState('');
  const [showCoinmarketcap, setShowCoinmarketcap] = useState(false);
  const [showOpensea, setShowOpensea] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasExistingCoinmarketcap = Boolean(initialData?.coinmarketcapApiKey);
  const hasExistingOpensea = Boolean(initialData?.openseaApiKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const data: UpdateUserSettingsDto = {};

    if (coinmarketcapKey) {
      if (coinmarketcapKey.length < 20) {
        setError('CoinMarketCap API key must be at least 20 characters');
        return;
      }
      data.coinmarketcapApiKey = coinmarketcapKey;
    }

    if (openseaKey) {
      if (openseaKey.length < 20) {
        setError('OpenSea API key must be at least 20 characters');
        return;
      }
      data.openseaApiKey = openseaKey;
    }

    if (Object.keys(data).length === 0) {
      setError('Please enter at least one API key');
      return;
    }

    try {
      await onSubmit(data);
      setSuccess(true);
      setCoinmarketcapKey('');
      setOpenseaKey('');
    } catch (err) {
      setError('Failed to save API keys');
    }
  };

  return (
    <Card>
      <CardHeader title="API Keys" />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">API keys saved successfully</Alert>}

          <TextField
            label="CoinMarketCap API Key"
            type={showCoinmarketcap ? 'text' : 'password'}
            value={coinmarketcapKey}
            onChange={(e) => setCoinmarketcapKey(e.target.value)}
            placeholder={hasExistingCoinmarketcap ? maskApiKey(initialData?.coinmarketcapApiKey) : 'Enter your CoinMarketCap API key'}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCoinmarketcap(!showCoinmarketcap)}
                    edge="end"
                  >
                    {showCoinmarketcap ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText={hasExistingCoinmarketcap ? 'Leave empty to keep existing key' : ''}
          />

          <TextField
            label="OpenSea API Key"
            type={showOpensea ? 'text' : 'password'}
            value={openseaKey}
            onChange={(e) => setOpenseaKey(e.target.value)}
            placeholder={hasExistingOpensea ? maskApiKey(initialData?.openseaApiKey) : 'Enter your OpenSea API key'}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowOpensea(!showOpensea)}
                    edge="end"
                  >
                    {showOpensea ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText={hasExistingOpensea ? 'Leave empty to keep existing key' : ''}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Save API Keys
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
