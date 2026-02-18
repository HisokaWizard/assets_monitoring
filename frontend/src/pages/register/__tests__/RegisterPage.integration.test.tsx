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

describe('RegisterPage Integration', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (authHooks.useRegister as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });
  });

  it('redirects to /login on successful registration', async () => {
    mockRegister.mockResolvedValue({ id: '1', email: 'test@test.com', role: 'user' });
    
    render(
      <RegisterPage />
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('displays error when registration fails', async () => {
    const errorMessage = 'Пользователь уже существует';
    mockRegister.mockRejectedValue(new Error(errorMessage));
    
    (authHooks.useRegister as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: new Error(errorMessage),
    });
    
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      expect(screen.getByText(/пользователь уже существует/i)).toBeInTheDocument();
    });
  });

  it('calls register with correct data', async () => {
    mockRegister.mockResolvedValue({ id: '1', email: 'newuser@test.com', role: 'user' });
    
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'newuser@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        password: 'password123',
        role: 'user',
      });
    });
  });
});
