# Sub-task 4: Создание API hook'ов

## Задача

Создать удобные хуки для использования auth API в React компонентах.

## Способ решения

1. Создать хук `useAuth` для доступа к состоянию аутентификации
2. Создать хук `useLogin` для выполнения входа
3. Создать хук `useRegister` для выполнения регистрации
4. Добавить обработку ошибок и состояния загрузки

## Подготовка тесткейсов для TDD

1. **Тест useAuth**: Проверить что хук возвращает isAuthenticated, user, token
2. **Тест useLogin**: Проверить что хук вызывает login mutation и dispatch setCredentials
3. **Тест useRegister**: Проверить что хук вызывает register mutation
4. **Тест useLogin loading state**: Проверить что isLoading обновляется корректно
5. **Тест useLogin error state**: Проверить что ошибка пробрасывается в компонент
6. **Тест useLogin success**: Проверить что успешный login обновляет Redux store

```typescript
// tests/unit/features/auth/hooks.spec.ts
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useAuth, useLogin, useRegister } from '../../../src/features/auth/hooks';
import { store } from '../../../src/app/providers/store';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

describe('Auth Hooks', () => {
  describe('useAuth', () => {
    it('should return auth state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('useLogin', () => {
    it('should return login function and loading state', () => {
      const { result } = renderHook(() => useLogin(), { wrapper });
      expect(typeof result.current.login).toBe('function');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle error state', () => {
      const { result } = renderHook(() => useLogin(), { wrapper });
      expect(result.current.error).toBeNull();
    });
  });

  describe('useRegister', () => {
    it('should return register function and loading state', () => {
      const { result } = renderHook(() => useRegister(), { wrapper });
      expect(typeof result.current.register).toBe('function');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

## Ожидаемый результат

- Файл `frontend/src/features/auth/hooks/useAuth.ts`
- Файл `frontend/src/features/auth/hooks/useLogin.ts`
- Файл `frontend/src/features/auth/hooks/useRegister.ts`
- Индексный файл экспорта `frontend/src/features/auth/hooks/index.ts`
- Все тесты для хуков проходят успешно

## Критерии приёмки

- [ ] Хуки возвращают типизированные данные
- [ ] Обработка состояния loading для UI
- [ ] Обработка ошибок API с типизацией
- [ ] Хуки могут быть использованы в любых компонентах
- [ ] Созданы unit-тесты для всех хуков
- [ ] Все тесты проходят (`npm test`)
