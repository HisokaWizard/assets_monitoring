# Sub-task 1: Создание UI компонента LoginPage

## Описание
Создание страницы входа с формой аутентификации на MUI компонентах.

## Решение

### Структура файла
```
src/pages/login/
├── LoginPage.tsx      # Основной компонент страницы
├── index.ts           # Barrel export
└── __tests__/
    └── LoginPage.test.tsx  # Unit тесты
```

### MUI компоненты
```tsx
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress 
} from '@mui/material';
```

## Подготовка тесткейсов для TDD

### Unit тесты (Jest + React Testing Library)

1. **Тест рендера формы**: Проверить что форма рендерится с email и password полями
2. **Тест рендера кнопки**: Проверить что кнопка "Войти" отображается
3. **Тест валидации - empty fields**: При сабмите с пустыми полями должны показываться ошибки
4. **Тест валидации - invalid email**: При некорректном email показывается ошибка валидации
5. **Тест состояния loading**: При isLoading=true кнопка disabled и показывается CircularProgress
6. **Тест отображения ошибки**: При error=true показывается Alert с текстом ошибки

```typescript
// src/pages/login/__tests__/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/app/providers/store';
import { LoginPage } from '../LoginPage';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<Provider store={store}>{ui}</Provider>);
};

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    renderWithProvider(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderWithProvider(<LoginPage />);
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    renderWithProvider(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    await waitFor(() => {
      expect(screen.getByText(/email обязателен/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    renderWithProvider(<LoginPage />);
    // Тест с передачей isLoading пропса
  });

  it('shows error alert when error prop is provided', () => {
    renderWithProvider(<LoginPage error="Неверные учетные данные" />);
    expect(screen.getByText(/неверные учетные данные/i)).toBeInTheDocument();
  });
});
```

## Ожидаемый результат

- Файл `src/pages/login/LoginPage.tsx` с формой
- Файл `src/pages/login/index.ts` с экспортом
- Файл `src/pages/login/__tests__/LoginPage.test.tsx` с unit тестами
- Все 6 тестов проходят

## Критерии приёмки

- [ ] Форма содержит email и password поля
- [ ] Поля имеют label и required атрибуты
- [ ] Кнопка отображается и имеет текст "Войти"
- [ ] Компонент принимает пропсы для callback функций, isLoading, error
- [ ] Созданы unit тесты (минимум 5 тестов)
- [ ] Все тесты проходят (`npm run test`)
