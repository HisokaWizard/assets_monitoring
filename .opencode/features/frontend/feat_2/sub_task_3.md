# Sub-task 3: Создание auth slice

## Задача

Создать Redux slice для управления состоянием аутентификации пользователя.

## Способ решения

1. Создать auth slice в `features/auth/model/authSlice.ts`
2. Определить начальное состояние (isAuthenticated, user, token)
3. Добавить reducers для:
   - setCredentials (сохранение токена и пользователя)
   - logout (очистка состояния)
4. Интегрировать с authApi через extraReducers

## Подготовка тесткейсов для TDD

1. **Тест initial state**: Проверить что начальное состояние содержит isAuthenticated: false
2. **Тест setCredentials**: Проверить что экшен setCredentials обновляет token, user и isAuthenticated
3. **Тест logout**: Проверить что экшен logout сбрасывает состояние к initial state
4. **Тест localStorage**: Проверить что setCredentials сохраняет token в localStorage
5. **Тест selectors**: Проверить что селекторы возвращают правильные значения
6. **Тест интеграции с authApi**: Проверить что login.fulfilled обновляет token

```typescript
// tests/unit/features/auth/authSlice.spec.ts
import { authReducer, setCredentials, logout } from '../../../src/features/auth/model';
import { authApi } from '../../../src/shared/api/auth';

describe('Auth Slice', () => {
  const initialState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCredentials', () => {
    const payload = {
      token: 'test-token',
      user: { id: 1, email: 'test@example.com', role: 'user', createdAt: '', updatedAt: '' }
    };
    const state = authReducer(initialState, setCredentials(payload));
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('test-token');
    expect(state.user).toEqual(payload.user);
  });

  it('should handle logout', () => {
    const loggedInState = {
      isAuthenticated: true,
      user: { id: 1, email: 'test@example.com', role: 'user', createdAt: '', updatedAt: '' },
      token: 'test-token',
    };
    const state = authReducer(loggedInState, logout());
    expect(state).toEqual(initialState);
  });

  it('should handle login.fulfilled', () => {
    const action = {
      type: authApi.endpoints.login.matchFulfilled.type,
      payload: { access_token: 'new-token' }
    };
    const state = authReducer(initialState, action);
    expect(state.token).toBe('new-token');
    expect(state.isAuthenticated).toBe(true);
  });
});
```

## Ожидаемый результат

- Файл `frontend/src/features/auth/model/authSlice.ts`
- Файл `frontend/src/features/auth/model/selectors.ts` — селекторы
- Интеграция slice в глобальный store
- Все тесты slice проходят успешно

## Критерии приёмки

- [ ] Slice экспортирует actions: setCredentials, logout
- [ ] Селекторы для получения isAuthenticated, user, token
- [ ] При logout очищается localStorage и состояние
- [ ] Интеграция с RTK Query для автоматического обновления состояния
- [ ] Созданы unit-тесты для slice и reducers
- [ ] Все тесты проходят (`npm test`)
