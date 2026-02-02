# BACKEND.md — Паттерны разработки Backend (NestJS)

## Навигация

- [Архитектурные паттерны](#архитектурные-паттерны)
- [Структура модулей](#структура-модулей)
- [Паттерны сервисов](#паттерны-сервисов)
- [Паттерны контроллеров](#паттерны-контроллеров)
- [Паттерны Entities](#паттерны-entities)
- [Паттерны тестирования](#паттерны-тестирования)
- [Паттерны API интеграций](#паттерны-api-интеграций)
- [Паттерны Cron-задач](#паттерны-cron-задач)
- [Команды](#команды)

---

## Архитектурные паттерны

### Модульная архитектура NestJS

Приложение разбивается на независимые модули, каждый модуль инкапсулирует связанную функциональность:

- **Модули** (`@Module`) — контейнеры для организации кода
- **Контроллеры** (`@Controller`) — обрабатывают HTTP запросы
- **Сервисы** (`@Injectable`) — содержат бизнес-логику
- **Провайдеры** — компоненты, доступные для инжекции

### Dependency Injection (DI)

```typescript
// Зависимости предоставляются через конструктор
@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
  ) {}
}
```

Принципы:
- Компоненты не создают зависимости сами
- Контейнер NestJS разрешает зависимости
- Слабая связанность и легкость тестирования

### SOLID принципы

1. **Single Responsibility** — каждый сервис отвечает за одну задачу
2. **Open/Closed** — открыты для расширения, закрыты для модификации
3. **Liskov Substitution** — наследование Entity (CryptoAsset/NFTAsset extends Asset)
4. **Interface Segregation** — DTO для разных операций (Create/Update)
5. **Dependency Inversion** — зависимость от абстракций (Repository)

---

## Структура модулей

### Шаблон модуля

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, HistoricalPrice]),
    forwardRef(() => AuthModule),
    HttpModule,
  ],
  controllers: [AssetsController],
  providers: [
    AssetsService,
    AssetUpdateService,
  ],
  exports: [AssetsService],
})
export class AssetsModule {}
```

### Правила модулей

1. **Один домен = один модуль** (assets, auth, notifications)
2. **Entity регистрируются в imports** через `TypeOrmModule.forFeature()`
3. **Циклические зависимости** разрешаются через `forwardRef()`
4. **Экспортируйте сервисы** которые используются другими модулями
5. **Импортируйте модули** от которых зависите

### Структура директории модуля

```
src/module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── dto/
│   ├── create-entity.dto.ts
│   ├── update-entity.dto.ts
│   └── response-entity.dto.ts
└── entity-name.entity.ts
```

---

## Паттерны сервисов

### Базовый шаблон сервиса

```typescript
/**
 * @fileoverview Сервис для управления сущностями.
 *
 * Содержит бизнес-логику для работы с сущностями.
 * Взаимодействует с базой данных через репозитории.
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class EntityService {
  private readonly logger = new Logger(EntityService.name);

  constructor(
    @InjectRepository(Entity)
    private entityRepository: Repository<Entity>,
  ) {}

  /**
   * Найти все сущности.
   */
  async findAll(): Promise<Entity[]> {
    return this.entityRepository.find();
  }

  /**
   * Найти сущность по ID.
   *
   * @throws NotFoundException если сущность не найдена
   */
  async findOne(id: number): Promise<Entity> {
    const entity = await this.entityRepository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  /**
   * Создать сущность.
   */
  async create(dto: CreateEntityDto): Promise<Entity> {
    this.logger.log(`Creating entity: ${dto.name}`);
    const entity = this.entityRepository.create(dto);
    return this.entityRepository.save(entity);
  }

  /**
   * Обновить сущность.
   */
  async update(id: number, dto: UpdateEntityDto): Promise<Entity> {
    await this.findOne(id); // Проверка существования
    await this.entityRepository.update(id, dto);
    return this.findOne(id);
  }

  /**
   * Удалить сущность.
   */
  async remove(id: number): Promise<void> {
    const result = await this.entityRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
  }
}
```

### Паттерн сервиса с внешним API

```typescript
@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(
    private httpService: HttpService,
    @InjectRepository(Entity)
    private entityRepository: Repository<Entity>,
  ) {}

  /**
   * Получить данные из внешнего API.
   */
  async fetchFromExternalApi(param: string): Promise<ApiResponse> {
    try {
      const response = await this.httpService.axiosRef.get(
        `${API_URL}/${param}`,
        {
          headers: { 'X-API-Key': this.configService.get('API_KEY') },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch from API: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Обновить сущности из внешнего API.
   */
  async updateEntities(): Promise<number[]> {
    const entities = await this.entityRepository.find();
    const updatedIds: number[] = [];

    for (const entity of entities) {
      try {
        const data = await this.fetchFromExternalApi(entity.param);
        await this.processAndSave(entity, data);
        updatedIds.push(entity.id);
      } catch (error) {
        this.logger.error(
          `Failed to update entity ${entity.id}: ${error.message}`,
        );
      }
    }

    return updatedIds;
  }

  private async processAndSave(
    entity: Entity,
    data: ApiResponse,
  ): Promise<void> {
    // Обработка и сохранение
    entity.field = data.value;
    await this.entityRepository.save(entity);
  }
}
```

### Паттерн авторизации в сервисе

```typescript
@Injectable()
export class SecureService {
  async findOne(
    id: number,
    userId: number,
    userRole: string,
  ): Promise<Asset> {
    const entity = await this.entityRepository.findOneBy({ id });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    // Проверка прав доступа
    if (userRole !== 'admin' && entity.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return entity;
  }
}
```

---

## Паттерны контроллеров

### Базовый CRUD контроллер

```typescript
/**
 * @fileoverview Контроллер для управления сущностями.
 *
 * Предоставляет REST API endpoints для работы с сущностями.
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('entities')
@UseGuards(JwtAuthGuard)
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Get()
  findAll(@Query('filter') filter: string, @Req() req: RequestWithUser) {
    return this.entityService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.entityService.findOne(+id, req.user.id, req.user.role);
  }

  @Post()
  create(@Body() dto: CreateEntityDto, @Req() req: RequestWithUser) {
    return this.entityService.create(dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEntityDto,
    @Req() req: RequestWithUser,
  ) {
    return this.entityService.update(+id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.entityService.remove(+id, req.user.id);
  }
}
```

### Паттерн Admin-only endpoint

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  @Post('trigger-update')
  async triggerManualUpdate() {
    return this.service.performUpdate();
  }
}
```

### Паттерн фильтрации через Query

```typescript
@Get()
findAll(
  @Query('type') type?: string,
  @Query('symbol') symbol?: string,
  @Query('page') page = '1',
  @Query('limit') limit = '10',
  @Req() req: RequestWithUser,
) {
  return this.service.findAll({
    userId: req.user.id,
    type,
    symbol,
    page: +page,
    limit: +limit,
  });
}
```

---

## Паттерны Entities

### Базовая Entity с наследованием

```typescript
/**
 * @fileoverview Базовая сущность актива с наследованием.
 *
 * Используется Table Per Class стратегия наследования.
 */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  TableInheritance,
  ChildEntity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  amount: number;

  @Column('decimal')
  middlePrice: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@ChildEntity('crypto')
export class CryptoAsset extends Asset {
  @Column()
  symbol: string;

  @Column('decimal')
  currentPrice: number;
}

@ChildEntity('nft')
export class NFTAsset extends Asset {
  @Column()
  collectionName: string;

  @Column('decimal')
  floorPrice: number;
}
```

### Entity с индексами и связями

```typescript
@Entity()
@Index(['userId', 'type'])
export class NotificationSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.notificationSettings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  type: string;

  @Column({ type: 'decimal', default: 5 })
  thresholdPercent: number;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastNotified: Date;
}
```

---

## Паттерны тестирования

### Unit-тест сервиса (TDD Red → Green)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityService } from './entity.service';
import { Entity } from './entity.entity';

describe('EntityService', () => {
  let service: EntityService;
  let repository: jest.Mocked<Repository<Entity>>;

  const mockEntity: Entity = {
    id: 1,
    name: 'Test',
    userId: 1,
  } as Entity;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityService,
        {
          provide: getRepositoryToken(Entity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EntityService>(EntityService);
    repository = module.get(getRepositoryToken(Entity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all entities for user', async () => {
      const entities = [mockEntity, { ...mockEntity, id: 2 }];
      repository.find.mockResolvedValue(entities);

      const result = await service.findAll(1);

      expect(repository.find).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(result).toEqual(entities);
    });

    it('should return empty array when no entities', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return entity by ID', async () => {
      repository.findOneBy.mockResolvedValue(mockEntity);

      const result = await service.findOne(1, 1, 'user');

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockEntity);
    });

    it('should throw NotFoundException when entity not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999, 1, 'user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when access denied', async () => {
      const otherEntity = { ...mockEntity, userId: 2 };
      repository.findOneBy.mockResolvedValue(otherEntity);

      await expect(service.findOne(1, 1, 'user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create and save entity', async () => {
      const dto = { name: 'New Entity' };
      repository.create.mockReturnValue(mockEntity);
      repository.save.mockResolvedValue(mockEntity);

      const result = await service.create(dto as any, 1);

      expect(repository.create).toHaveBeenCalledWith({ ...dto, userId: 1 });
      expect(repository.save).toHaveBeenCalledWith(mockEntity);
      expect(result).toEqual(mockEntity);
    });
  });
});
```

### Паттерн тестирования с HTTP моками

```typescript
describe('ExternalApiService', () => {
  let service: ExternalApiService;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExternalApiService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExternalApiService>(ExternalApiService);
    httpService = module.get(HttpService);
  });

  it('should fetch data from API', async () => {
    const mockResponse = { data: { price: 100 } };
    httpService.axiosRef.get.mockResolvedValue(mockResponse);

    const result = await service.fetchFromExternalApi('BTC');

    expect(result).toEqual({ price: 100 });
  });

  it('should handle API errors', async () => {
    httpService.axiosRef.get.mockRejectedValue(new Error('Network error'));

    await expect(service.fetchFromExternalApi('BTC')).rejects.toThrow(
      'Network error',
    );
  });
});
```

---

## Паттерны API интеграций

### Интеграция с REST API

```typescript
@Injectable()
export class CoinMarketCapService {
  private readonly apiUrl = 'https://pro-api.coinmarketcap.com/v1';
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('COINMARKETCAP_API_KEY');
  }

  async getCryptoPrice(symbol: string): Promise<number> {
    const response = await this.httpService.axiosRef.get(
      `${this.apiUrl}/cryptocurrency/quotes/latest`,
      {
        params: { symbol },
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
        },
      },
    );

    return response.data.data[symbol].quote.USD.price;
  }
}
```

### Паттерн обработки ошибок API

```typescript
@Injectable()
export class ApiIntegrationService {
  private readonly logger = new Logger(ApiIntegrationService.name);

  async safeApiCall<T>(
    apiCall: () => Promise<T>,
    fallbackValue: T,
    context: string,
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      this.logger.error(
        `API call failed (${context}): ${error.message}`,
        error.stack,
      );
      return fallbackValue;
    }
  }
}
```

---

## Паттерны Cron-задач

### SchedulerService шаблон

```typescript
/**
 * @fileoverview Планировщик задач для периодических операций.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private updateService: AssetUpdateService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Обновление активов и проверка алертов — каждые 4 часа.
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async handleAssetUpdatesAndNotifications() {
    this.logger.log('Starting scheduled asset update');

    try {
      // 1. Обновить активы
      const updatedIds = await this.updateService.updateEntities();
      this.logger.log(`Updated ${updatedIds.length} entities`);

      // 2. Проверить алерты
      await this.notificationService.checkAlertsAfterUpdate(updatedIds);

      // 3. Генерировать ежедневный отчет
      await this.notificationService.generateDailyReports();
    } catch (error) {
      this.logger.error(
        `Scheduled task failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Еженедельные отчеты — каждый понедельник в 9:00.
   */
  @Cron('0 9 * * 1')
  async handleWeeklyReports() {
    this.logger.log('Generating weekly reports');
    await this.notificationService.generatePeriodicReports('weekly');
  }

  /**
   * Ежемесячные отчеты — 1 числа в 9:00.
   */
  @Cron('0 9 1 * *')
  async handleMonthlyReports() {
    this.logger.log('Generating monthly reports');
    await this.notificationService.generatePeriodicReports('monthly');
  }

  /**
   * Ручной запуск обновления (для тестирования).
   */
  async triggerManualUpdate(): Promise<void> {
    this.logger.log('Manual update triggered');
    await this.handleAssetUpdatesAndNotifications();
  }
}
```

### Паттерн условного выполнения

```typescript
@Injectable()
export class ConditionalSchedulerService {
  /**
   * Выполнять только если прошел интервал с последнего запуска.
   */
  async updateIfNeeded(userId: number): Promise<boolean> {
    const settings = await this.settingsRepository.findOneBy({ userId });

    if (!settings || !settings.isEnabled) {
      return false;
    }

    const now = new Date();
    const lastUpdate = settings.lastUpdated || new Date(0);
    const hoursSinceLastUpdate =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastUpdate < settings.updateIntervalHours) {
      return false; // Слишком рано для обновления
    }

    await this.performUpdate(userId);
    return true;
  }
}
```

---

## Команды

**Все команды запускать из директории `backend/`:**

```bash
# Установка зависимостей
npm install

# Запуск разработки
npm run start:dev

# Сборка production
npm run build

# Запуск production
npm run start:prod

# Форматирование кода
npm run format

# Линтинг
npm run lint

# Запуск всех тестов
npm test

# Запуск конкретного теста
npm test -- entity.service.spec.ts

# Запуск тестов по названию
npm test -- --testNamePattern="should create"

# Watch режим
npm run test:watch

# Покрытие
npm run test:cov

# E2E тесты
npm run test:e2e

# Сидинг данных
npm run seed

# Работа с БД
npm run db:view
npm run db:clear
npm run db:reset
```

---

## Чеклист создания нового модуля

- [ ] Создать директорию `src/module-name/`
- [ ] Создать Entity с декораторами TypeORM
- [ ] Создать DTO (Create/Update) с class-validator
- [ ] Создать Service с CRUD методами и JSDoc
- [ ] Создать Controller с маршрутами и guards
- [ ] Создать Module с imports/providers/exports
- [ ] Добавить Module в `app.module.ts`
- [ ] Написать unit-тесты для Service (TDD)
- [ ] Запустить тесты: `npm test -- module.service.spec.ts`
- [ ] Проверить линтинг: `npm run lint`
- [ ] Проверить форматирование: `npm run format`