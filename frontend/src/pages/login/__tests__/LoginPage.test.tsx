import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '../LoginPage';
import * as authHooks from '../../../features/auth/hooks';

jest.mock('../../../features/auth/hooks', () => ({
  useLogin: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  const mockOnSubmit = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (authHooks.useLogin as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });
  });

  it('renders email and password fields', () => {
    render(<LoginPage onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
  });

  it('renders submit button with text "Войти"', () => {
    render(<LoginPage onSubmit={mockOnSubmit} />);
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('shows validation error on empty submit', async () => {
    render(<LoginPage onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email обязателен/i)).toBeInTheDocument();
    });
  });

  it('does not call onSubmit for invalid email format (browser validation)', async () => {
    render(<LoginPage onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('calls onSubmit with form data on valid submit', async () => {
    render(<LoginPage onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123'
      });
    });
  });

  it('shows loading state when isLoading is true', () => {
    (authHooks.useLogin as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
    });
    
    render(<LoginPage onSubmit={mockOnSubmit} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });

  it('shows error alert when error is provided', () => {
    (authHooks.useLogin as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: { message: 'Неверные учетные данные' },
    });
    
    render(<LoginPage onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/неверные учетные данные/i)).toBeInTheDocument();
  });
});
