import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterPage } from '../RegisterPage';
import * as authHooks from '../../../features/auth/hooks';

jest.mock('../../../features/auth/hooks', () => ({
  useRegister: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegisterPage', () => {
  const mockOnSubmit = jest.fn();
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (authHooks.useRegister as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });
  });

  it('renders registration form with all fields', () => {
    render(<RegisterPage onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/подтверждение пароля/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders submit button with text "Зарегистрироваться"', () => {
    render(<RegisterPage onSubmit={mockOnSubmit} />);
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<RegisterPage onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email обязателен/i)).toBeInTheDocument();
      expect(screen.getByText(/пароль обязателен/i)).toBeInTheDocument();
      expect(screen.getByText(/подтверждение пароля обязательно/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when password is too short', async () => {
    render(<RegisterPage onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/пароль должен быть минимум 6 символов/i)).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), { target: { value: 'differentpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/пароли не совпадают/i)).toBeInTheDocument();
    });
  });

  it('shows loading state when isLoading is true', () => {
    (authHooks.useRegister as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
    });
    
    render(<RegisterPage onSubmit={mockOnSubmit} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });

  it('shows error alert when error is provided', () => {
    (authHooks.useRegister as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: { message: 'Пользователь уже существует' },
    });
    
    render(<RegisterPage onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/пользователь уже существует/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form data on valid submit', async () => {
    render(<RegisterPage onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
        role: 'user',
      });
    });
  });
});
