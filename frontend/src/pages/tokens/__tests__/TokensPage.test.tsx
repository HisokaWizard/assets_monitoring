import { screen, renderWithProviders } from '@shared/test-utils';
import { TokensPage } from '../TokensPage';

describe('TokensPage', () => {
  it('should render without errors', () => {
    renderWithProviders(<TokensPage />);
  });

  it('should display Tokens title', () => {
    renderWithProviders(<TokensPage />);
    expect(screen.getByText('Tokens')).toBeInTheDocument();
  });

  it('should render in a Container', () => {
    renderWithProviders(<TokensPage />);
    const container = screen.getByText('Tokens').closest('.MuiContainer-root');
    expect(container).toBeInTheDocument();
  });
});
