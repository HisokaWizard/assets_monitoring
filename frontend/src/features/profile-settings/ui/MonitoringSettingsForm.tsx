/**
 * @fileoverview Форма для настроек мониторинга.
 *
 * Позволяет управлять настройками мониторинга для Crypto и NFT раздельно.
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  NotificationSettings,
  AssetType,
  UpdateNotificationSettingsDto,
  selectSettingsByAssetType,
} from '../../../entities/notification-settings';

/**
 * Props для компонента MonitoringSettingsForm.
 */
export interface MonitoringSettingsFormProps {
  /**
   * Массив настроек.
   */
  settings?: NotificationSettings[];

  /**
   * Callback для обновления настроек.
   */
  onUpdate: (id: number, data: UpdateNotificationSettingsDto) => Promise<void>;

  /**
   * Callback для создания настроек.
   */
  onCreate: (assetType: AssetType) => Promise<void>;

  /**
   * Флаг загрузки.
   */
  isLoading?: boolean;
}

/**
 * Доступные интервалы.
 */
const INTERVALS = [2, 4, 6, 8, 10, 12];

/**
 * Компонент для одной секции настроек.
 */
const SettingsSection: React.FC<{
  title: string;
  assetType: AssetType;
  settings?: NotificationSettings;
  onUpdate: (id: number, data: UpdateNotificationSettingsDto) => Promise<void>;
  onCreate: (assetType: AssetType) => Promise<void>;
  isLoading?: boolean;
}> = ({ title, assetType, settings, onUpdate, onCreate, isLoading }) => {
  const [localEnabled, setLocalEnabled] = React.useState(settings?.enabled ?? true);
  const [localThreshold, setLocalThreshold] = React.useState(settings?.thresholdPercent ?? 10);
  const [localInterval, setLocalInterval] = React.useState(settings?.updateIntervalHours ?? 4);

  React.useEffect(() => {
    if (settings) {
      setLocalEnabled(settings.enabled);
      setLocalThreshold(settings.thresholdPercent);
      setLocalInterval(settings.updateIntervalHours);
    }
  }, [settings]);

  const handleEnabledChange = async (enabled: boolean) => {
    setLocalEnabled(enabled);
    if (settings) {
      await onUpdate(settings.id, { enabled });
    }
  };

  const handleThresholdChange = async (_: Event, value: number | number[]) => {
    const threshold = Array.isArray(value) ? value[0] : value;
    setLocalThreshold(threshold);
    if (settings) {
      await onUpdate(settings.id, { thresholdPercent: threshold });
    }
  };

  const handleIntervalChange = async (interval: number) => {
    setLocalInterval(interval);
    if (settings) {
      await onUpdate(settings.id, { updateIntervalHours: interval });
    }
  };

  React.useEffect(() => {
    if (!settings) {
      onCreate(assetType);
    }
  }, [settings, assetType, onCreate]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={title}
        action={
          <FormControlLabel
            control={
              <Switch
                checked={localEnabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
                disabled={isLoading || !settings}
                data-testid={`${assetType}-enabled-switch`}
              />
            }
            label="Enabled"
          />
        }
      />
      <CardContent>
        {isLoading && !settings ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Alert Threshold: {localThreshold}%
              </Typography>
              <Slider
                value={localThreshold}
                onChange={handleThresholdChange}
                min={1}
                max={50}
                step={1}
                disabled={isLoading || !settings || !localEnabled}
                valueLabelDisplay="auto"
                data-testid={`${assetType}-threshold-slider`}
              />
              <Typography variant="caption" color="text.secondary">
                Receive alerts when price changes by this percentage
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth disabled={isLoading || !settings || !localEnabled}>
                <InputLabel>Update Interval (hours)</InputLabel>
                <Select
                  value={localInterval}
                  label="Update Interval (hours)"
                  onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  data-testid={`${assetType}-interval-select`}
                >
                  {INTERVALS.map((interval) => (
                    <MenuItem key={interval} value={interval}>
                      Every {interval} hours
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                How often to check for price updates
              </Typography>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Форма для настроек мониторинга.
 */
export const MonitoringSettingsForm: React.FC<MonitoringSettingsFormProps> = ({
  settings,
  onUpdate,
  onCreate,
  isLoading = false,
}) => {
  const cryptoSettings = selectSettingsByAssetType(settings, 'crypto');
  const nftSettings = selectSettingsByAssetType(settings, 'nft');

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Monitoring Settings
      </Typography>

      <SettingsSection
        title="Crypto Monitoring"
        assetType="crypto"
        settings={cryptoSettings}
        onUpdate={onUpdate}
        onCreate={onCreate}
        isLoading={isLoading}
      />

      <SettingsSection
        title="NFT Monitoring"
        assetType="nft"
        settings={nftSettings}
        onUpdate={onUpdate}
        onCreate={onCreate}
        isLoading={isLoading}
      />
    </Box>
  );
};
