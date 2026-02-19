import { screen, renderWithProviders } from '@shared/test-utils';
import { NftsPage } from '../NftsPage';

describe('NftsPage', () => {
  it('should render without errors', () => {
    renderWithProviders(<NftsPage />);
  });

  it('should display NFTs title', () => {
    renderWithProviders(<NftsPage />);
    expect(screen.getByText('NFTs')).toBeInTheDocument();
  });

  it('should render in a Container', () => {
    renderWithProviders(<NftsPage />);
    const container = screen.getByText('NFTs').closest('.MuiContainer-root');
    expect(container).toBeInTheDocument();
  });
});
