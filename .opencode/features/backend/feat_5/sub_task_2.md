# Sub-task 2: Обновить E2E тесты

## Описание

Обновить E2E тесты для работы с JWT авторизацией.

## Зависимости

- Sub-task 1: JWT Guard добавлен

## Способ решения

### 1. Обновить E2E тесты в test/notifications.e2e-spec.ts

#### Добавить helper для получения токена

```typescript
let authToken: string;

beforeAll(async () => {
  // Создать тестового пользователя и получить токен
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'test@test.com', password: 'password' });
  
  authToken = loginResponse.body.access_token;
});
```

#### Обновить все тесты

```typescript
it('should return user settings', () => {
  return request(app.getHttpServer())
    .get('/notifications/settings')
    .set('Authorization', `Bearer ${authToken}`)  // <-- Добавить
    .expect(200);
});

it('should create settings', () => {
  return request(app.getHttpServer())
    .post('/notifications/settings')
    .set('Authorization', `Bearer ${authToken}`)  // <-- Добавить
    .send({ assetType: 'crypto' })
    .expect(201);
});
```

### 2. Добавить тесты для unauthorized

```typescript
it('should return 401 without token', () => {
  return request(app.getHttpServer())
    .get('/notifications/settings')
    .expect(401);
});

it('should return 401 with invalid token', () => {
  return request(app.getHttpServer())
    .get('/notifications/settings')
    .set('Authorization', 'Bearer invalid-token')
    .expect(401);
});
```

### 3. Обновить test setup

Убедиться, что тестовая база данных создается с пользователем для авторизации.

## Подготовка тесткейсов для TDD

### E2E тесты

1. **GET settings - with valid token**
2. **GET settings - without token (401)**
3. **GET settings - with invalid token (401)**
4. **POST settings - with valid token**
5. **POST settings - without token (401)**
6. **PUT settings/:id - with valid token**
7. **PUT settings/:id - without token (401)**
8. **DELETE settings/:id - with valid token**
9. **DELETE settings/:id - without token (401)**
10. **GET logs - with valid token**
11. **GET logs - without token (401)**

## Ожидаемый результат

- Все E2E тесты проходят
- Тесты проверяют авторизацию
- Нет падающих тестов

## Критерии приёмки

- [ ] Helper для получения authToken создан
- [ ] Все существующие тесты обновлены с Authorization header
- [ ] Добавлены тесты для 401 unauthorized
- [ ] Все тесты проходят
