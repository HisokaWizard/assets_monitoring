# Sub-task 5: Создание Module и интеграция

## Описание

Создать NestJS модуль `UserSettingsModule` и зарегистрировать его в `AppModule`. Модуль должен объединить entity, service и controller.

## Способ решения

### Структура файла

Создать `backend/src/user-settings/user-settings.module.ts`:

```typescript
/**
 * @fileoverview Модуль настроек пользователя.
 *
 * Группирует компоненты для работы с API-ключами пользователя:
 * controller, service и entity.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSettingsController } from './user-settings.controller';
import { UserSettingsService } from './user-settings.service';
import { UserSettings } from './core/entities/user-settings.entity';

/**
 * Модуль настроек пользователя.
 *
 * @Module декоратор определяет:
 * - imports: импортируемые модули (TypeOrmModule для entity)
 * - controllers: контроллеры для обработки HTTP запросов
 * - providers: сервисы для dependency injection
 * - exports: экспортируемые провайдеры (если нужны в других модулях)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSettings]),
  ],
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}
```

### Интеграция в AppModule

Обновить `backend/src/app.module.ts`:

```typescript
import { UserSettingsModule } from './user-settings/user-settings.module';

@Module({
  imports: [
    // ... другие модули
    UserSettingsModule,
  ],
})
export class AppModule {}
```

### Индексный файл модуля

Создать `backend/src/user-settings/index.ts`:

```typescript
export { UserSettingsModule } from './user-settings.module';
export { UserSettingsService } from './user-settings.service';
export { UserSettingsController } from './user-settings.controller';
export { UserSettings } from './core/entities/user-settings.entity';
export { CreateUserSettingsDto, UpdateUserSettingsDto } from './core/dto';
```

### Добавление переменной окружения

Обновить `.env` и `.env.example`:

```bash
# Encryption key for API keys (should be 32 bytes for AES-256)
API_KEYS_ENCRYPTION_KEY=your-super-secret-encryption-key-min-32-chars
```

### Обновление ConfigModule

Убедиться, что ConfigModule загружает переменные окружения (обычно уже настроен).

## Подготовка тесткейсов для TDD

### Unit-тесты для Module

1. **Module definition**
   - Тест: класс UserSettingsModule определен
   - Тест: имеет декоратор @Module
   - Тест: импортирует TypeOrmModule.forFeature([UserSettings])

2. **Module configuration**
   - Тест: controllers содержит UserSettingsController
   - Тест: providers содержит UserSettingsService
   - Тест: exports содержит UserSettingsService

### Интеграционные тесты

3. **AppModule integration**
   - Тест: UserSettingsModule импортирован в AppModule
   - Тест: приложение компилируется без ошибок
   - Тест: все dependencies resolved

4. **Database integration**
   - Тест: TypeORM регистрирует UserSettings entity
   - Тест: таблица создается в БД

5. **Dependency injection**
   - Тест: UserSettingsService может быть инжектирован
   - Тест: UserSettingsController может быть инстанцирован
   - Тест: Repository<UserSettings> может быть инжектирован

### E2E тесты

6. **Application bootstrap**
   - Тест: приложение стартует с UserSettingsModule
   - Тест: endpoints доступны
   - Тест: Swagger документация включает новые endpoints (если используется)

## Ожидаемый результат

- Файл `user-settings.module.ts` создан
- Модуль зарегистрирован в `AppModule`
- Индексный файл для публичных экспортов
- Переменная окружения добавлена
- Модуль корректно интегрирован

## Критерии приёмки

- [ ] UserSettingsModule создан
- [ ] Модуль импортирован в AppModule
- [ ] TypeOrmModule.forFeature настроен
- [ ] Controller и Service зарегистрированы
- [ ] Переменная окружения API_KEYS_ENCRYPTION_KEY добавлена
- [ ] Unit-тесты модуля проходят
- [ ] Интеграционные тесты проходят
- [ ] Приложение компилируется без ошибок
- [ ] E2E тесты проходят
