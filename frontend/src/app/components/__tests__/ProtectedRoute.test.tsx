import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../../../features/auth/model';
import { ProtectedRoute } from '../ProtectedRoute';

const createTestStore = (isAuth: boolean) => configureStore({
  reducer: { auth: authReducer },
  preloadedState: {
    auth: { isAuthenticated: isAuth, user: null, token: null }
  }
});

const renderWithRouter = (isAuth: boolean, initialEntries: string[]) => {
  const store = createTestStore(isAuth);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div data-testid="home">Home</div>} />
            <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login">Login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithRouter(false, ['/dashboard']);
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('renders child route when authenticated', () => {
    renderWithRouter(true, ['/dashboard']);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('redirects to /login when accessing root protected route', () => {
    renderWithRouter(false, ['/']);
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('allows access to login page when not authenticated', () => {
    const store = createTestStore(false);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<div data-testid="login">Login</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });
});
