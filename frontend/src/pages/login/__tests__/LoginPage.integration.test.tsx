import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../../../features/auth/model';
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

describe('LoginPage Integration', () => {
  const mockLogin = jest.fn().mockResolvedValue(undefined);
  
  beforeEach(() => {
    jest.clearAllMocks();
    (authHooks.useLogin as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });
  });

  it('calls login with form data on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    
    const store = configureStore({
      reducer: { auth: authReducer },
    });
    
    render(
      <Provider store={store}>
        <LoginPage />
      </Provider>
    );
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  it('navigates to home on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    
    const store = configureStore({
      reducer: { auth: authReducer },
    });
    
    render(
      <Provider store={store}>
        <LoginPage />
      </Provider>
    );
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('displays error when login fails', async () => {
    const errorMessage = 'Invalid credentials';
    (authHooks.useLogin as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: { message: errorMessage },
    });
    
    const store = configureStore({
      reducer: { auth: authReducer },
    });
    
    render(
      <Provider store={store}>
        <LoginPage />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', () => {
    (authHooks.useLogin as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
    });
    
    const store = configureStore({
      reducer: { auth: authReducer },
    });
    
    render(
      <Provider store={store}>
        <LoginPage />
      </Provider>
    );
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });
});
