import { screen, renderWithProviders } from '@shared/test-utils';
import { ProfilePage } from '../ProfilePage';

describe('ProfilePage', () => {
  it('should render without errors', () => {
    renderWithProviders(<ProfilePage />);
  });

  it('should show error when user not authenticated', () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText(/User not found/i)).toBeInTheDocument();
  });

  it('should render Profile title', () => {
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
});
