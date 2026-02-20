# Sub-task 6: Написание тестов

## Описание

Написать полный набор тестов: unit-тесты для service и controller, интеграционные тесты для module, E2E тесты для API endpoints.

## Способ решения

### Структура тестов

```
backend/src/user-settings/
├── user-settings.controller.spec.ts
├── user-settings.service.spec.ts
├── user-settings.module.spec.ts
└── test/
    └── user-settings.e2e-spec.ts
```

### Unit-тесты для Service (user-settings.service.spec.ts)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserSettingsService } from './user-settings.service';
import { UserSettings } from './core/entities/user-settings.entity';
import { CreateUserSettingsDto, UpdateUserSettingsDto } from './core/dto';
import { User } from '../auth/user.entity';

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let repository: Repository<UserSettings>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashed',
    role: 'user',
    lastUpdated: null,
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-encryption-key-32-chars-long!!'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsService,
        {
          provide: getRepositoryToken(UserSettings),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UserSettingsService>(UserSettingsService);
    repository = module.get<Repository<UserSettings>>(getRepositoryToken(UserSettings));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('should return null if settings not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      
      const result = await service.getUserSettings(mockUser);
      
      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });

    it('should return decrypted settings', async () => {
      const encryptedSettings = {
        id: 1,
        userId: 1,
        coinmarketcapApiKey: 'encrypted-cmc-key',
        openseaApiKey: 'encrypted-os-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findOne.mockResolvedValue(encryptedSettings);
      
      const result = await service.getUserSettings(mockUser);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });
  });

  describe('createSettings', () => {
    it('should create settings with encrypted keys', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({
        id: 1,
        userId: 1,
        coinmarketcapApiKey: 'encrypted',
        openseaApiKey: 'encrypted',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dto: CreateUserSettingsDto = {
        coinmarketcapApiKey: 'test-key-32-chars-long-for-cmc',
        openseaApiKey: 'test-key-32-chars-long-for-os',
      };

      const result = await service.createSettings(mockUser, dto);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error if settings already exist', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });

      const dto: CreateUserSettingsDto = {};

      await expect(service.createSettings(mockUser, dto)).rejects.toThrow(
        'User settings already exist',
      );
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ id: 1, userId: 1 })
        .mockResolvedValueOnce({
          id: 1,
          userId: 1,
          coinmarketcapApiKey: 'encrypted',
          openseaApiKey: 'encrypted',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const dto: UpdateUserSettingsDto = {
        coinmarketcapApiKey: 'new-key-32-chars-long-for-cmc',
      };

      const result = await service.updateSettings(mockUser, dto);

      expect(result).toBeDefined();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if settings not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const dto: UpdateUserSettingsDto = {};

      await expect(service.updateSettings(mockUser, dto)).rejects.toThrow();
    });
  });
});
```

### Unit-тесты для Controller (user-settings.controller.spec.ts)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserSettingsController } from './user-settings.controller';
import { UserSettingsService } from './user-settings.service';
import { UserSettings } from './core/entities/user-settings.entity';
import { User } from '../auth/user.entity';

describe('UserSettingsController', () => {
  let controller: UserSettingsController;
  let service: UserSettingsService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashed',
    role: 'user',
    lastUpdated: null,
  };

  const mockService = {
    getUserSettings: jest.fn(),
    createSettings: jest.fn(),
    updateSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSettingsController],
      providers: [
        {
          provide: UserSettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UserSettingsController>(UserSettingsController);
    service = module.get<UserSettingsService>(UserSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return user settings', async () => {
      const expectedSettings = { id: 1, userId: 1 } as UserSettings;
      mockService.getUserSettings.mockResolvedValue(expectedSettings);

      const result = await controller.getSettings(mockUser);

      expect(result).toEqual(expectedSettings);
      expect(service.getUserSettings).toHaveBeenCalledWith(mockUser);
    });

    it('should return null if no settings', async () => {
      mockService.getUserSettings.mockResolvedValue(null);

      const result = await controller.getSettings(mockUser);

      expect(result).toBeNull();
    });
  });

  describe('createSettings', () => {
    it('should create settings', async () => {
      const dto = { coinmarketcapApiKey: 'test-key' };
      const expectedSettings = { id: 1, ...dto } as UserSettings;
      mockService.createSettings.mockResolvedValue(expectedSettings);

      const result = await controller.createSettings(mockUser, dto);

      expect(result).toEqual(expectedSettings);
      expect(service.createSettings).toHaveBeenCalledWith(mockUser, dto);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const dto = { openseaApiKey: 'new-key' };
      const expectedSettings = { id: 1, ...dto } as UserSettings;
      mockService.updateSettings.mockResolvedValue(expectedSettings);

      const result = await controller.updateSettings(mockUser, dto);

      expect(result).toEqual(expectedSettings);
      expect(service.updateSettings).toHaveBeenCalledWith(mockUser, dto);
    });
  });
});
```

### E2E тесты (test/user-settings.e2e-spec.ts)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UserSettingsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /user-settings', () => {
    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/user-settings')
        .expect(401);
    });

    it('should return settings with auth', () => {
      return request(app.getHttpServer())
        .get('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /user-settings', () => {
    it('should create settings', () => {
      return request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'test-cmc-key-32-chars-long-minimum',
          openseaApiKey: 'test-os-key-32-chars-long-minimum',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.coinmarketcapApiKey).toBe('test-cmc-key-32-chars-long-minimum');
        });
    });

    it('should validate short keys', () => {
      return request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'short',
        })
        .expect(400);
    });
  });

  describe('PATCH /user-settings', () => {
    it('should update settings', () => {
      return request(app.getHttpServer())
        .patch('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'updated-key-32-chars-long-minimum',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.coinmarketcapApiKey).toBe('updated-key-32-chars-long-minimum');
        });
    });
  });
});
```

## Подготовка тесткейсов для TDD

### Unit-тесты - Service

1. **getUserSettings**
   - Возвращает null если настроек нет
   - Возвращает дешифрованные настройки
   - Правильный where clause (userId)

2. **createSettings**
   - Создает настройки с зашифрованными ключами
   - Возвращает дешифрованные настройки
   - Выбрасывает ошибку при duplicate
   - Работает с одним ключом
   - Работает без ключей

3. **updateSettings**
   - Обновляет существующие настройки
   - Возвращает дешифрованные настройки
   - Выбрасывает NotFoundException
   - Частичное обновление

4. **Encryption**
   - Шифрование работает
   - Дешифрование работает
   - Разные IV каждый раз

### Unit-тесты - Controller

5. **getSettings**
   - Вызывает service.getUserSettings
   - Передает user
   - Возвращает результат

6. **createSettings**
   - Вызывает service.createSettings
   - Передает user и dto
   - Возвращает 201

7. **updateSettings**
   - Вызывает service.updateSettings
   - Передает user и dto
   - Возвращает 200

### Интеграционные тесты

8. **Module**
   - Компилируется без ошибок
   - Dependencies resolved
   - TypeORM регистрирует entity

### E2E тесты

9. **Authentication**
   - 401 без токена
   - 200 с валидным токеном

10. **GET endpoint**
    - Возвращает настройки или null
    - Правильный формат ответа

11. **POST endpoint**
    - Создает настройки
    - 400 при невалидных данных
    - 400 при duplicate

12. **PATCH endpoint**
    - Обновляет настройки
    - 404 если настроек нет
    - 400 при невалидных данных

13. **Validation**
    - Минимальная длина ключей
    - Максимальная длина ключей
    - Опциональность полей

## Ожидаемый результат

- Полный набор unit-тестов для service
- Полный набор unit-тестов для controller
- Интеграционные тесты для module
- E2E тесты для всех endpoints
- Покрытие > 80%

## Критерии приёмки

- [ ] Unit-тесты service проходят
- [ ] Unit-тесты controller проходят
- [ ] Интеграционные тесты проходят
- [ ] E2E тесты проходят
- [ ] Покрытие кода > 80%
- [ ] Все edge cases покрыты
- [ ] Тесты читаемы и поддерживаемы
