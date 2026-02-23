# Sub-task 1: Создать API слой и Redux slice для user-settings

## Описание

Создать полноценный слой для работы с API пользовательских настроек (API ключи) на фронтенде.

## Способ решения

### 1. Создать структуру в FSD архитектуре

```
src/
├── entities/
│   └── user-settings/
│       ├── model/
│       │   ├── types.ts           # Типы UserSettings
│       │   └── userSettingsSlice.ts  # RTK Query API
│       └── index.ts               # Public API
```

### 2. Определить типы (types.ts)

```typescript
export interface UserSettings {
  id: number;
  userId: number;
  coinmarketcapApiKey?: string;
  openseaApiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserSettingsDto {
  coinmarketcapApiKey?: string;
  openseaApiKey?: string;
}
```

### 3. Создать RTK Query API (userSettingsSlice.ts)

Использовать `createApi` из Redux Toolkit с `fetchBaseQuery`.

Endpoints:
- `getUserSettings` - GET /user-settings
- `createUserSettings` - POST /user-settings
- `updateUserSettings` - PATCH /user-settings

### 4. Интегрировать в store

Добавить reducer и middleware в `app/providers/store.ts`.

### 5. Создать кастомный хук (опционально)

`useUserSettings` - инкапсулирует логику получения и обновления настроек.

## Подготовка тесткейсов для TDD

### Unit тесты для API (`__tests__/userSettingsApi.test.ts`)

1. **GET user settings - success**
   - Мокаем успешный ответ от API
   - Проверяем, что query возвращает данные

2. **GET user settings - unauthorized**
   - Мокаем 401 ответ
   - Проверяем обработку ошибки

3. **PATCH user settings - success**
   - Мокаем успешное обновление
   - Проверяем, что mutation отправляет правильные данные

4. **PATCH user settings - validation error**
   - Мокаем 400 ответ
   - Проверяем обработку ошибки валидации

### Unit тесты для types

5. **Type guards (если используются)**
   - Проверка корректности типизации

## Ожидаемый результат

- Файлы созданы в `src/entities/user-settings/`
- RTK Query API работает с `/user-settings`
- Типы экспортируются через Public API
- Unit тесты проходят

## Критерии приёмки

- [ ] Создана структура `entities/user-settings/`
- [ ] Определены типы `UserSettings`, `UpdateUserSettingsDto`
- [ ] RTK Query API с endpoints: getUserSettings, createUserSettings, updateUserSettings
- [ ] API интегрирован в Redux store
- [ ] Unit тесты написаны и проходят
- [ ] Public API экспортирует типы и хуки
