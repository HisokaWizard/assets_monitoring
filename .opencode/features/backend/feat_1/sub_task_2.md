# Sub-task 2: Unit Tests for AuthController

## Описание
Написать unit тесты для AuthController, покрывающие endpoint'ы /auth/register и /auth/login.

## Способ решения (используем contextDocs)

Перед реализацией получить контекст:
```typescript
[context_docs: {"layer": "backend", "search": "controller test"}]
```

### Что тестируем:
1. **POST /auth/register**:
   - Успешная регистрация возвращает 201
   - Возвращает созданного пользователя (без пароля)
   - Правильные данные передаются в service

2. **POST /auth/login**:
   - Успешный вход возвращает 200
   - Возвращает JWT токен
   - Правильные данные передаются в service

### Структура теста:
```typescript
describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => { ... });
  describe('login', () => { ... });
});
```

## Файл для создания
`backend/src/auth/auth.controller.spec.ts`

## Критерии приёмки
- [ ] Тесты для POST /auth/register:
  - [ ] Возвращает 201 при успехе
  - [ ] Вызывает authService.register с правильными данными
  - [ ] Не возвращает пароль в ответе
- [ ] Тесты для POST /auth/login:
  - [ ] Возвращает 200 при успехе
  - [ ] Вызывает authService.login с правильными данными
  - [ ] Возвращает JWT токен
- [ ] Все моки настроены корректно
- [ ] Тесты проходят: `npm test -- auth.controller.spec.ts`
