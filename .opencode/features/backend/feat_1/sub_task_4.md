# Sub-task 4: E2E Tests for Auth Module

## Описание
Написать E2E (end-to-end) тесты для auth модуля, тестирующие полный цикл запроса.

## Способ решения (используем contextDocs)

Перед реализацией получить контекст:
```typescript
[context_docs: {"layer": "backend", "topic": "TESTING"}]
[context_docs: {"layer": "backend", "search": "e2e test"}]
```

### Что тестируем:
1. **POST /auth/register**:
   - Успешная регистрация через HTTP запрос
   - Пользователь сохраняется в БД
   - Ошибка при duplicate email

2. **POST /auth/login**:
   - Успешный вход через HTTP запрос
   - Возвращается JWT токен
   - Ошибка 401 при неверных credentials

### Структура теста:
```typescript
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => { ... });
  describe('/auth/login (POST)', () => { ... });
});
```

### Использование supertest:
```typescript
return request(app.getHttpServer())
  .post('/auth/register')
  .send({ email: 'test@test.com', password: 'password123' })
  .expect(201)
  .expect((res) => {
    expect(res.body.email).toBe('test@test.com');
    expect(res.body.password).toBeUndefined();
  });
```

## Файл для создания
`backend/test/auth.e2e-spec.ts`

## Критерии приёмки
- [ ] E2E тесты для POST /auth/register:
  - [ ] Возвращает 201 и создаёт пользователя
  - [ ] Пользователь сохраняется в БД
  - [ ] Возвращает 400/409 при duplicate email
- [ ] E2E тесты для POST /auth/login:
  - [ ] Возвращает 200 и JWT токен при успехе
  - [ ] Возвращает 401 при неверных credentials
  - [ ] Токен можно использовать для защищённых маршрутов
- [ ] Тестовая БД используется (не production)
- [ ] Тесты проходят: `npm run test:e2e -- auth.e2e-spec.ts`
