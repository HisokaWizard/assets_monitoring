# Sub-task 2: Создание DTO

## Описание

Создать DTO (Data Transfer Objects) для создания и обновления настроек пользователя с валидацией полей API-ключей.

## Способ решения

### Структура файлов

Создать в `backend/src/user-settings/core/dto/`:

#### create-user-settings.dto.ts

```typescript
/**
 * @fileoverview DTO для создания настроек пользователя.
 *
 * Определяет структуру данных для создания настроек API.
 */

import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * DTO для создания настроек пользователя.
 */
export class CreateUserSettingsDto {
  /**
   * API-ключ CoinMarketCap.
   * Должен быть не менее 20 символов (обычно 32).
   */
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  coinmarketcapApiKey?: string;

  /**
   * API-ключ OpenSea.
   * Должен быть не менее 20 символов.
   */
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  openseaApiKey?: string;
}
```

#### update-user-settings.dto.ts

```typescript
/**
 * @fileoverview DTO для обновления настроек пользователя.
 *
 * Наследует от CreateUserSettingsDto, делая все поля опциональными.
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateUserSettingsDto } from './create-user-settings.dto';

/**
 * DTO для обновления настроек пользователя.
 */
export class UpdateUserSettingsDto extends PartialType(CreateUserSettingsDto) {}
```

#### index.ts

```typescript
export { CreateUserSettingsDto } from './create-user-settings.dto';
export { UpdateUserSettingsDto } from './update-user-settings.dto';
```

### Валидация

Используем `class-validator` декораторы:
- `@IsOptional()` - поле необязательное
- `@IsString()` - должно быть строкой
- `@MinLength(20)` - минимум 20 символов (API-ключи обычно длинные)
- `@MaxLength(500)` - максимум 500 символов (защита от переполнения)

## Подготовка тесткейсов для TDD

### Unit-тесты для CreateUserSettingsDto

1. **Validation - coinmarketcapApiKey**
   - Тест: принимает валидный ключ (32 символа)
   - Тест: отклоняет ключ короче 20 символов
   - Тест: отклоняет ключ длиннее 500 символов
   - Тест: принимает undefined (опциональное поле)
   - Тест: отклоняет null
   - Тест: отклоняет number

2. **Validation - openseaApiKey**
   - Тест: принимает валидный ключ (40+ символов)
   - Тест: отклоняет ключ короче 20 символов
   - Тест: отклоняет ключ длиннее 500 символов
   - Тест: принимает undefined (опциональное поле)

3. **Validation - both keys**
   - Тест: принимает объект с обоими ключами
   - Тест: принимает объект только с coinmarketcapApiKey
   - Тест: принимает объект только с openseaApiKey
   - Тест: принимает пустой объект

### Unit-тесты для UpdateUserSettingsDto

4. **PartialType behavior**
   - Тест: наследует валидацию от CreateUserSettingsDto
   - Тест: все поля опциональны
   - Тест: принимает partial update (только один ключ)

### Интеграционные тесты

5. **Pipe validation**
   - Тест: ValidationPipe корректно валидирует DTO
   - Тест: правильные сообщения об ошибках

## Ожидаемый результат

- Файлы DTO созданы в `core/dto/`
- Валидация настроена с class-validator
- Все DTO экспортируются через index.ts
- Тесты покрывают все сценарии валидации

## Критерии приёмки

- [ ] CreateUserSettingsDto создан с валидацией
- [ ] UpdateUserSettingsDto наследует от Create
- [ ] Минимальная длина ключей: 20 символов
- [ ] Максимальная длина: 500 символов
- [ ] Все поля опциональны
- [ ] Unit-тесты проходят
- [ ] Сообщения об ошибках понятны
