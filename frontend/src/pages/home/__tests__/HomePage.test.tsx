import { screen, renderWithProviders } from '@shared/test-utils';
import { HomePage } from '../HomePage';

describe('HomePage', () => {
  it('should render main title', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Assets Monitoring')).toBeInTheDocument();
  });

  it('should render subtitle with description', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Track your cryptocurrency and NFT portfolio')).toBeInTheDocument();
  });

  it('should render NFTs card', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('NFTs')).toBeInTheDocument();
    expect(screen.getByText('View your NFT portfolio')).toBeInTheDocument();
  });

  it('should render Tokens card', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Tokens')).toBeInTheDocument();
    expect(screen.getByText('View your token holdings')).toBeInTheDocument();
  });

  it('should render Profile card', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your account')).toBeInTheDocument();
  });

  it('should render Logout card', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Sign out of your account')).toBeInTheDocument();
  });

  it('should render in a Container component', () => {
    renderWithProviders(<HomePage />);
    const container = screen.getByText('Assets Monitoring').closest('.MuiContainer-root');
    expect(container).toBeInTheDocument();
  });

  it('should render 4 navigation cards', () => {
    renderWithProviders(<HomePage />);
    const cards = screen.getAllByRole('button');
    expect(cards.length).toBe(4);
  });
});
