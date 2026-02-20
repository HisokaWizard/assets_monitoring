# Feature 4: User API Settings Entity (Backend)

## Описание

Реализация сущности для хранения API-ключей пользователя (CoinMarketCap и OpenSea) в backend. Сущность должна быть связана с User (1-к-1), иметь REST API для CRUD операций и редактироваться со страницы профиля.

## Контекст

- **Стек**: NestJS, TypeORM, PostgreSQL, class-validator
- **Архитектура**: Модульная структура NestJS (аналогично notifications модулю)
- **Паттерн**: Отдельная сущность UserSettings с ManyToOne связью к User
- **Пример**: NotificationSettings entity и модуль

## Архитектурное решение

**Выбрано: Отдельный модуль user-settings**

Причины:
1. **Разделение ответственности**: User содержит базовые данные аутентификации, UserSettings - конфигурационные данные
2. **Расширяемость**: Легко добавлять новые поля настроек
3. **Безопасность**: API-ключи изолированы в отдельной таблице
4. **1-к-1 связь**: Каждый пользователь имеет ровно один набор настроек

## Структура модуля

```
backend/src/user-settings/
├── core/
│   ├── dto/
│   │   ├── create-user-settings.dto.ts
│   │   ├── update-user-settings.dto.ts
│   │   └── index.ts
│   └── entities/
│       └── user-settings.entity.ts
├── user-settings.controller.ts
├── user-settings.service.ts
└── user-settings.module.ts
```

## Декомпозиция

### Sub-task 1: Создание Entity UserSettings
Создать TypeORM entity с полями для API-ключей и связью с User.

- **Сложность**: Medium
- **Зависимости**: Нет

### Sub-task 2: Создание DTO
DTO для создания и обновления настроек с валидацией.

- **Сложность**: Low
- **Зависимости**: Sub-task 1

### Sub-task 3: Создание Service
Сервис с бизнес-логикой для CRUD операций.

- **Сложность**: Medium
- **Зависимости**: Sub-task 1, Sub-task 2

### Sub-task 4: Создание Controller
REST API endpoints для работы с настройками.

- **Сложность**: Medium
- **Зависимости**: Sub-task 3

### Sub-task 5: Создание Module и интеграция
NestJS модуль и регистрация в AppModule.

- **Сложность**: Low
- **Зависимости**: Sub-task 4

### Sub-task 6: Написание тестов
Unit-тесты для service и controller, E2E тесты.

- **Сложность**: Medium
- **Зависимости**: Sub-task 1-5

## Ожидаемый результат

- Entity `UserSettings` с полями:
  - `id: number` (PK)
  - `userId: number` (FK к User)
  - `coinmarketcapApiKey?: string` (nullable, encrypted)
  - `openseaApiKey?: string` (nullable, encrypted)
  - `createdAt: Date`
  - `updatedAt: Date`
- REST API:
  - `GET /user-settings` - получить настройки текущего пользователя
  - `POST /user-settings` - создать настройки
  - `PATCH /user-settings` - обновить настройки
- Связь ManyToOne с User
- Валидация DTO (минимальная длина ключей)
- **Шифрование**: API-ключи должны храниться в зашифрованном виде
- Тесты: unit + E2E

## Связанные файлы

- `backend/src/auth/user.entity.ts` - User entity
- `backend/src/notifications/core/entities/notification-settings.entity.ts` - пример entity
- `backend/src/notifications/notifications.service.ts` - пример сервиса
- `backend/src/notifications/notifications.controller.ts` - пример контроллера
- `backend/src/app.module.ts` - регистрация модуля

## Технические детали

### Шифрование API-ключей

Для безопасности ключи должны шифроваться перед сохранением:
- Использовать `crypto` модуль Node.js или библиотеку `cryptr`
- Ключ шифрования хранить в переменных окружения (`API_KEYS_ENCRYPTION_KEY`)
- Дешифровать при получении из БД

### API Endpoints

```typescript
@Controller('user-settings')
export class UserSettingsController {
  @Get()
  getSettings(@GetUser() user: User): Promise<UserSettings>

  @Post()
  createSettings(
    @GetUser() user: User,
    @Body() dto: CreateUserSettingsDto
  ): Promise<UserSettings>

  @Patch()
  updateSettings(
    @GetUser() user: User,
    @Body() dto: UpdateUserSettingsDto
  ): Promise<UserSettings>
}
```
