# Sub-task 1: Создание типов и интерфейсов

## Задача

Создать TypeScript типы и интерфейсы для аутентификации и модели пользователя.

## Способ решения

1. Создать типы для API запросов (LoginDto, RegisterDto)
2. Создать типы для API ответов (AuthResponse, User)
3. Создать интерфейс состояния auth в Redux
4. Разместить типы в соответствующих слоях FSD:
   - `entities/user/model/types.ts` — модель пользователя
   - `shared/api/auth/types.ts` — типы для API

## Подготовка тесткейсов для TDD

Тесты для типов проверяют compile-time type safety, поэтому используем TypeScript компилятор:

1. **Тест типов User**: Проверить что User интерфейс содержит все обязательные поля (id, email, role, createdAt, updatedAt)
2. **Тест типов LoginDto**: Проверить что LoginDto содержит email и password
3. **Тест типов RegisterDto**: Проверить что RegisterDto содержит email, password, role
4. **Тест AuthState**: Проверить что AuthState содержит isAuthenticated, user, token
5. **Тесты на strict typing**: Убедиться что компилятор отлавливает неверные типы

```typescript
// Пример тестового файла для типов
// tests/unit/types/auth.types.spec.ts
describe('Auth Types', () => {
  it('should have correct User interface', () => {
    const user: User = {
      id: 1,
      email: 'test@example.com',
      role: 'user',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    };
    expect(user).toBeDefined();
  });

  it('should have correct LoginDto', () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'password123'
    };
    expect(dto).toBeDefined();
  });
});
```

## Ожидаемый результат

- Файл `frontend/src/entities/user/model/types.ts` с интерфейсом User
- Файл `frontend/src/shared/api/auth/types.ts` с LoginDto, RegisterDto, AuthResponse
- Файл `frontend/src/features/auth/model/types.ts` с AuthState
- Тесты типов проходят успешно (`npm run typecheck`)

## Критерии приёмки

- [ ] Все типы соответствуют backend DTO
- [ ] Типы экспортируются и могут быть использованы в других модулях
- [ ] Используется strict TypeScript
- [ ] TypeScript компилятор проходит без ошибок
- [ ] Созданы unit-тесты для проверки типов
