import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MonitoringSettingsForm } from '../ui/MonitoringSettingsForm';

describe('MonitoringSettingsForm', () => {
  const mockOnUpdate = jest.fn();
  const mockOnCreate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
    mockOnCreate.mockClear();
    mockOnUpdate.mockResolvedValue(undefined);
    mockOnCreate.mockResolvedValue(undefined);
  });

  const cryptoSettings = {
    id: 1,
    userId: 1,
    assetType: 'crypto' as const,
    enabled: true,
    thresholdPercent: 10,
    intervalHours: 4,
    updateIntervalHours: 4,
  };

  const nftSettings = {
    id: 2,
    userId: 1,
    assetType: 'nft' as const,
    enabled: true,
    thresholdPercent: 15,
    intervalHours: 6,
    updateIntervalHours: 6,
  };

  it('should render both crypto and nft sections', () => {
    render(
      <MonitoringSettingsForm
        settings={[cryptoSettings, nftSettings]}
        onUpdate={mockOnUpdate}
        onCreate={mockOnCreate}
      />
    );
    expect(screen.getByText('Crypto Monitoring')).toBeInTheDocument();
    expect(screen.getByText('NFT Monitoring')).toBeInTheDocument();
  });

  it('should render with existing settings', () => {
    render(
      <MonitoringSettingsForm
        settings={[cryptoSettings, nftSettings]}
        onUpdate={mockOnUpdate}
        onCreate={mockOnCreate}
      />
    );
    expect(screen.getByText('Alert Threshold: 10%')).toBeInTheDocument();
    expect(screen.getByText('Alert Threshold: 15%')).toBeInTheDocument();
  });

  it('should call onCreate when settings missing', async () => {
    render(
      <MonitoringSettingsForm
        onUpdate={mockOnUpdate}
        onCreate={mockOnCreate}
      />
    );
    
    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith('crypto');
      expect(mockOnCreate).toHaveBeenCalledWith('nft');
    });
  });

  it('should toggle crypto enabled switch', async () => {
    render(
      <MonitoringSettingsForm
        settings={[cryptoSettings, nftSettings]}
        onUpdate={mockOnUpdate}
        onCreate={mockOnCreate}
      />
    );
    
    const cryptoSwitch = screen.getByTestId('crypto-enabled-switch');
    fireEvent.click(cryptoSwitch);
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(1, { enabled: false });
    });
  });

  it('should toggle nft enabled switch', async () => {
    render(
      <MonitoringSettingsForm
        settings={[cryptoSettings, nftSettings]}
        onUpdate={mockOnUpdate}
        onCreate={mockOnCreate}
      />
    );
    
    const nftSwitch = screen.getByTestId('nft-enabled-switch');
    fireEvent.click(nftSwitch);
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(2, { enabled: false });
    });
  });
});
