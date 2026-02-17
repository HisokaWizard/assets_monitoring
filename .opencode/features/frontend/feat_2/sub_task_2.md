# Sub-task 2: Создание auth API

## Задача

Реализовать API endpoints для авторизации и регистрации с использованием RTK Query.

## Способ решения

1. Создать базовый API клиент в `shared/api/base.ts`
2. Создать auth API с endpoints login и register
3. Настроить baseUrl для backend (http://localhost:3000/api)
4. Добавить автоматическую подстановку JWT токена в заголовки

## Подготовка тесткейсов для TDD

1. **Тест создания baseApi**: Проверить что baseApi создается с правильным reducerPath
2. **Тест endpoint login**: Проверить что login mutation отправляет POST запрос на /auth/login
3. **Тест endpoint register**: Проверить что register mutation отправляет POST запрос на /auth/register
4. **Тест middleware**: Проверить что RTK Query middleware добавлен в store
5. **Тест заголовков**: Проверить что JWT токен добавляется в заголовки запросов

```typescript
// tests/unit/api/authApi.spec.ts
import { authApi } from '../../../src/shared/api/auth/authApi';

describe('Auth API', () => {
  it('should have login endpoint', () => {
    expect(authApi.endpoints.login).toBeDefined();
  });

  it('should have register endpoint', () => {
    expect(authApi.endpoints.register).toBeDefined();
  });

  it('should export useLoginMutation hook', () => {
    const { useLoginMutation } = require('../../../src/shared/api/auth');
    expect(useLoginMutation).toBeDefined();
  });

  it('should export useRegisterMutation hook', () => {
    const { useRegisterMutation } = require('../../../src/shared/api/auth');
    expect(useRegisterMutation).toBeDefined();
  });
});
```

## Ожидаемый результат

- Файл `frontend/src/shared/api/base.ts` — базовый API клиент
- Файл `frontend/src/shared/api/auth/authApi.ts` — API аутентификации
- Экспорты хуков: `useLoginMutation`, `useRegisterMutation`
- Все тесты проходят успешно

## Критерии приёмки

- [ ] API клиент настроен с правильным baseUrl
- [ ] Endpoint login принимает email и password
- [ ] Endpoint register принимает email, password и role
- [ ] JWT токен сохраняется в localStorage после успешного login
- [ ] Типизация строгая, без any
- [ ] Созданы unit-тесты для API endpoints
- [ ] Все тесты проходят (`npm test`)
