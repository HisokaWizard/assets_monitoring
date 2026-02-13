# Feature 1: Write Tests for Auth Module

## Описание задачи
Написать unit и e2e тесты для существующего auth модуля. Код уже реализован, необходимо обеспечить покрытие тестами для соответствия TDD подходу.

## Контекст (из contextDocs)

Перед написанием тестов получить контекст:
```typescript
[context_docs: {"layer": "backend", "topic": "TESTING"}]
[context_docs: {"layer": "backend", "search": "jest"}]
```

**Существующий код:**
- `auth.service.ts` — методы register() и login()
- `auth.controller.ts` — endpoint'ы /auth/register и /auth/login
- `jwt.strategy.ts` — JWT валидация
- `user.entity.ts` — TypeORM entity
- DTO: `register.dto.ts`, `login.dto.ts`

## Декомпозиция

1. **Тесты для AuthService** — unit тесты для register и login методов
2. **Тесты для AuthController** — unit тесты для endpoint'ов
3. **Тесты для JWT Strategy** — unit тесты для validate метода
4. **E2E тесты для Auth** — интеграционные тесты всего модуля

## Оценка сложности
Средняя (2-3 часа)

## Зависимости
- Auth модуль реализован
- Jest настроен
- @nestjs/testing установлен

## Создано
2026-02-13

## Выполнено ✓

### Unit Tests (Все проходят)
- ✅ **auth.service.spec.ts** - 8 тестов:
  - register: успешная регистрация, хеширование пароля, duplicate email
  - login: успешный вход, неверный email, неверный пароль, JWT токен, безопасность

- ✅ **auth.controller.spec.ts** - 6 тестов:
  - POST /auth/register: 201, вызов service, безопасность
  - POST /auth/login: 200, JWT token, вызов service

- ✅ **jwt.strategy.spec.ts** - 7 тестов:
  - validate: payload → user object, id mapping, email, role, безопасность

### E2E Tests
- ✅ **auth.e2e-spec.ts** - создан (требует SQLite для запуска)
  - POST /auth/register: 201, сохранение в БД, duplicate email, валидация
  - POST /auth/login: 200, 401 ошибки, JWT токен
  - Protected routes: доступ с токеном, без токена, с невалидным токеном

## Команды для запуска
```bash
# Unit тесты (все проходят)
npm test -- auth.service.spec.ts
npm test -- auth.controller.spec.ts  
npm test -- jwt.strategy.spec.ts

# E2E тесты (требуют npm install sqlite3)
npm run test:e2e -- auth.e2e-spec.ts
```
