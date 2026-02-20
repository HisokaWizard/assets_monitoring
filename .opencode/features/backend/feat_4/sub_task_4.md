# Sub-task 4: Создание Controller

## Описание

Создать REST API controller для работы с настройками пользователя. Controller должен предоставлять endpoints для получения, создания и обновления настроек.

## Способ решения

### Структура файла

Создать `backend/src/user-settings/user-settings.controller.ts`:

```typescript
/**
 * @fileoverview Controller для настроек пользователя.
 *
 * Предоставляет REST API для управления API-ключами пользователя.
 */

import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { CreateUserSettingsDto, UpdateUserSettingsDto } from './core/dto';
import { UserSettings } from './core/entities/user-settings.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/user.entity';

/**
 * Controller для операций с настройками пользователя.
 *
 * Все маршруты требуют аутентификации.
 * @Controller('user-settings') создает префикс '/user-settings'.
 */
@Controller('user-settings')
@UseGuards(JwtAuthGuard)
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  /**
   * Получить настройки текущего пользователя.
   *
   * @param user - Аутентифицированный пользователь
   * @returns Настройки пользователя или null
   */
  @Get()
  async getSettings(@GetUser() user: User): Promise<UserSettings | null> {
    return this.userSettingsService.getUserSettings(user);
  }

  /**
   * Создать настройки для текущего пользователя.
   *
   * @param user - Аутентифицированный пользователь
   * @param dto - DTO с API-ключами
   * @returns Созданные настройки
   */
  @Post()
  async createSettings(
    @GetUser() user: User,
    @Body() dto: CreateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.userSettingsService.createSettings(user, dto);
  }

  /**
   * Обновить настройки текущего пользователя.
   *
   * @param user - Аутентифицированный пользователь
   * @param dto - DTO с API-ключами для обновления
   * @returns Обновленные настройки
   */
  @Patch()
  async updateSettings(
    @GetUser() user: User,
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.userSettingsService.updateSettings(user, dto);
  }
}
```

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /user-settings | Получить настройки | Yes |
| POST | /user-settings | Создать настройки | Yes |
| PATCH | /user-settings | Обновить настройки | Yes |

### Декораторы

- `@Controller('user-settings')` - базовый путь
- `@UseGuards(JwtAuthGuard)` - требовать JWT авторизацию
- `@GetUser()` - кастомный декоратор для получения пользователя из request

### Response форматы

**GET /user-settings (success):**
```json
{
  "id": 1,
  "userId": 1,
  "coinmarketcapApiKey": "actual-api-key-value",
  "openseaApiKey": "actual-api-key-value",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**GET /user-settings (not found):**
```json
null
```

**POST /user-settings (success):**
```json
{
  "id": 1,
  "userId": 1,
  "coinmarketcapApiKey": "actual-api-key-value",
  "openseaApiKey": "actual-api-key-value",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**POST /user-settings (already exists):**
```json
{
  "statusCode": 400,
  "message": "User settings already exist. Use update instead.",
  "error": "Bad Request"
}
```

**PATCH /user-settings (not found):**
```json
{
  "statusCode": 404,
  "message": "User settings not found",
  "error": "Not Found"
}
```

## Подготовка тесткейсов для TDD

### Unit-тесты для Controller

1. **Controller definition**
   - Тест: класс определен
   - Тест: имеет декоратор @Controller('user-settings')
   - Тест: использует JwtAuthGuard

2. **GET /user-settings**
   - Тест: вызывает userSettingsService.getUserSettings
   - Тест: передает user из декоратора
   - Тест: возвращает результат сервиса
   - Тест: возвращает null если настроек нет

3. **POST /user-settings**
   - Тест: вызывает userSettingsService.createSettings
   - Тест: передает user и dto
   - Тест: возвращает созданные настройки
   - Тест: обрабатывает ошибку "already exists"

4. **PATCH /user-settings**
   - Тест: вызывает userSettingsService.updateSettings
   - Тест: передает user и dto
   - Тест: возвращает обновленные настройки
   - Тест: обрабатывает NotFoundException

5. **Error handling**
   - Тест: ошибки валидации возвращают 400
   - Тест: NotFoundException возвращает 404
   - Тест: внутренние ошибки возвращают 500

### Интеграционные тесты

6. **Request/Response flow**
   - Тест: GET запрос возвращает правильный формат
   - Тест: POST запрос с валидными данными создает настройки
   - Тест: PATCH запрос обновляет настройки
   - Тест: запросы без JWT возвращают 401

7. **DTO validation**
   - Тест: невалидные данные возвращают 400 с деталями
   - Тест: отсутствие обязательных полей обрабатывается

### E2E тесты

8. **GET endpoint**
   ```typescript
   test('GET /user-settings should return user settings', async () => {
     const response = await request(app.getHttpServer())
       .get('/user-settings')
       .set('Authorization', `Bearer ${authToken}`)
       .expect(200);
     
     expect(response.body).toHaveProperty('userId');
   });
   ```

9. **POST endpoint**
   ```typescript
   test('POST /user-settings should create settings', async () => {
     const response = await request(app.getHttpServer())
       .post('/user-settings')
       .set('Authorization', `Bearer ${authToken}`)
       .send({
         coinmarketcapApiKey: 'test-key-12345678901234567890',
         openseaApiKey: 'test-key-12345678901234567890'
       })
       .expect(201);
     
     expect(response.body.coinmarketcapApiKey).toBe('test-key-12345678901234567890');
   });
   ```

10. **PATCH endpoint**
    ```typescript
    test('PATCH /user-settings should update settings', async () => {
      const response = await request(app.getHttpServer())
        .patch('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'updated-key-12345678901234567890'
        })
        .expect(200);
      
      expect(response.body.coinmarketcapApiKey).toBe('updated-key-12345678901234567890');
    });
    ```

## Ожидаемый результат

- Файл `user-settings.controller.ts` создан
- Реализованы endpoints: GET, POST, PATCH
- Все endpoints защищены JwtAuthGuard
- Корректная обработка ошибок
- Тесты покрывают все сценарии

## Критерии приёмки

- [ ] Controller создан согласно спецификации
- [ ] Все endpoints защищены авторизацией
- [ ] GET возвращает настройки или null
- [ ] POST создает настройки
- [ ] PATCH обновляет настройки
- [ ] Корректные HTTP статусы (200, 201, 400, 401, 404)
- [ ] Unit-тесты проходят
- [ ] E2E тесты проходят
