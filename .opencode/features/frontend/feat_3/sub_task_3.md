# Sub-task 3: Интеграция с бизнес-логикой

## Описание
Подключить LoginPage к `useLogin` hook и обработать состояния (loading, error, success).

## Решение

### Интеграция с useLogin
```tsx
import { useLogin } from '@/features/auth/hooks';
import { LoginDto } from '@/shared/api/auth/types';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useLogin();
  const navigate = useNavigate();
  
  const handleSubmit = async (data: LoginDto) => {
    try {
      await login(data);
      navigate('/', { replace: true });
    } catch (err) {
      // Ошибка обрабатывается в useLogin
    }
  };
  
  // ... рендер формы
};
```

### Файлы
- `src/pages/login/LoginPage.tsx` - обновленный с интеграцией
- `src/features/auth/hooks/__tests__/useLogin.test.tsx` - тесты hook (уже существует, проверить)

## Подготовка тесткейсов для TDD

### Integration тесты LoginPage с useLogin

1. **Тест успешного входа**: При успешном login вызывается navigate('/')
2. **Тест обработки ошибки**: При ошибке login отображается Alert
3. **Тест состояния загрузки**: При isLoading кнопка disabled
4. **Тест вызова login API**: При сабмите формы вызывается login mutation
5. **Тест передачи данных формы**: При сабмите в login передаются email и password

### Mock useLogin
```typescript
// Мок useLogin для тестов
const mockUseLogin = jest.fn();
jest.mock('@/features/auth/hooks', () => ({
  useLogin: () => mockUseLogin()
}));
```

### Тесты

```typescript
// src/pages/login/__tests__/LoginPage.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/app/providers/store';
import { LoginPage } from '../LoginPage';
import * as authHooks from '@/features/auth/hooks';

describe('LoginPage Integration', () => {
  const mockNavigate = jest.fn();
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    jest.spyOn(authHooks, 'useLogin').mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls login with form data on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<Provider store={store}><LoginPage /></Provider>);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123'
      });
    });
  });

  it('navigates to home on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<Provider store={store}><LoginPage /></Provider>);
    
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('displays error when login fails', async () => {
    mockLogin.mockRejectedValueOnce({ message: 'Invalid credentials' });
    jest.spyOn(authHooks, 'useLogin').mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: { message: 'Invalid credentials' }
    });
    
    render(<Provider store={store}><LoginPage /></Provider>);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', () => {
    jest.spyOn(authHooks, 'useLogin').mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null
    });
    
    render(<Provider store={store}><LoginPage /></Provider>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });
});
```

## Ожидаемый результат

- Файл `src/pages/login/LoginPage.tsx` интегрирован с useLogin
- Файл `src/pages/login/__tests__/LoginPage.integration.test.tsx` с интеграционными тестами
- Все тесты проходят

## Критерии приёмки

- [ ] Login вызывается при сабмите формы с правильными данными
- [ ] При успешном входе - редирект на `/`
- [ ] При ошибке - отображается Alert с текстом ошибки
- [ ] Во время загрузки - кнопка disabled + CircularProgress
- [ ] Созданы интеграционные тесты (минимум 4 теста)
- [ ] Используется мок для useLogin и useNavigate
- [ ] Все тесты проходят
