# Sub-task 1: Unit Tests for AuthService

## Описание
Написать unit тесты для AuthService, покрывающие методы register() и login().

## Способ решения (используем contextDocs)

Перед реализацией получить контекст:
```typescript
[context_docs: {"layer": "backend", "topic": "TESTING"}]
[context_docs: {"layer": "backend", "search": "mock repository"}]
```

### Что тестируем:
1. **register()**:
   - Успешная регистрация нового пользователя
   - Хеширование пароля перед сохранением
   - Ошибка при duplicate email

2. **login()**:
   - Успешный вход с правильными credentials
   - Ошибка при неверном email
   - Ошибка при неверном пароле
   - Генерация JWT токена

### Структура теста:
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('register', () => { ... });
  describe('login', () => { ... });
});
```

## Файл для создания
`backend/src/auth/auth.service.spec.ts`

## Критерии приёмки
- [ ] Тесты для register():
  - [ ] Успешная регистрация
  - [ ] Пароль хешируется
  - [ ] Ошибка при duplicate email
- [ ] Тесты для login():
  - [ ] Успешный вход
  - [ ] Ошибка "Invalid credentials" при неверном email
  - [ ] Ошибка "Invalid credentials" при неверном пароле
  - [ ] JWT токен генерируется
- [ ] Все моки настроены корректно
- [ ] Тесты проходят: `npm test -- auth.service.spec.ts`
