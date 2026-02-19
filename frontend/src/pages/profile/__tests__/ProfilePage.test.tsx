import { screen, renderWithProviders } from '@shared/test-utils';
import { ProfilePage } from '../ProfilePage';

describe('ProfilePage', () => {
  it('should render without errors', () => {
    renderWithProviders(<ProfilePage />);
  });

  it('should display Profile title', () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should render in a Container', () => {
    renderWithProviders(<ProfilePage />);
    const container = screen.getByText('Profile').closest('.MuiContainer-root');
    expect(container).toBeInTheDocument();
  });
});
