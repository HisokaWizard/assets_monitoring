# Sub-task 2: Настройка роутинга

## Описание
Добавить маршрут для страницы логирования, ProtectedRoute и настроить навигацию.

## Решение

### Файлы
- `src/app/router/index.tsx` - конфигурация роутера
- `src/app/components/ProtectedRoute.tsx` - компонент защиты маршрутов
- `src/app/router/__tests__/router.test.tsx` - тесты роутинга
- `src/app/components/__tests__/ProtectedRoute.test.tsx` - тесты ProtectedRoute

### ProtectedRoute компонент
```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { selectIsAuthenticated } from '@/features/auth';

export const ProtectedRoute = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
```

## Подготовка тесткейсов для TDD

### Unit тесты ProtectedRoute

1. **Тест неавторизованного пользователя**: При !isAuthenticated рендерит Navigate to="/login"
2. **Тест авторизованного пользователя**: При isAuthenticated=true рендерит Outlet (дочерний маршрут)
3. **Тест передачи state**: При редиректе передается state с текущим location
4. **Тест replace**: Используется replace для избежания history backloop

### Integration тесты роутера

1. **Тест маршрута /login**: Страница LoginPage доступна по /login
2. **Тест ProtectedRoute**: При попытке доступа к protected маршруту без auth - редирект
3. **Тест редиректа после login**: После успешного login редирект на главную

```typescript
// src/app/components/__tests__/ProtectedRoute.test.tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/model';
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
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithRouter(false, ['/dashboard']);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it('renders child route when authenticated', () => {
    renderWithRouter(true, ['/dashboard']);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
```

## Ожидаемый результат

- Файл `src/app/router/index.tsx` с настроенными маршрутами
- Файл `src/app/components/ProtectedRoute.tsx` 
- Файл `src/app/components/__tests__/ProtectedRoute.test.tsx`
- Файл `src/app/router/__tests__/router.test.tsx`
- Все тесты проходят

## Критерии приёмки

- [ ] Маршрут `/login` работает
- [ ] ProtectedRoute корректно перенаправляет неавторизованных
- [ ] ProtectedRoute рендерит дочерние маршруты для авторизованных
- [ ] Созданы unit тесты для ProtectedRoute (минимум 3 теста)
- [ ] Интеграционные тесты роутера (минимум 2 теста)
- [ ] Все тесты проходят
