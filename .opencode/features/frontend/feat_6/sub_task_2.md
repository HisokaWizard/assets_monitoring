# Sub-task 2: Создать API слой и Redux slice для notification-settings

## Описание

Создать полноценный слой для работы с API настроек уведомлений на фронтенде. Настройки разделены по assetType (crypto, nft).

## Зависимости

- Backend: JWT Guard должен быть добавлен для `/notifications/settings*` (задача backend/feat_X)

## Способ решения

### 1. Создать структуру в FSD архитектуре

```
src/
├── entities/
│   └── notification-settings/
│       ├── model/
│       │   ├── types.ts                    # Типы NotificationSettings
│       │   └── notificationSettingsSlice.ts # RTK Query API
│       └── index.ts                        # Public API
```

### 2. Определить типы (types.ts)

```typescript
export type AssetType = 'crypto' | 'nft';

export interface NotificationSettings {
  id: number;
  userId: number;
  assetType: AssetType;
  enabled: boolean;
  thresholdPercent: number;
  intervalHours: number;
  updateIntervalHours: number;
  lastNotified?: string;
}

export interface CreateNotificationSettingsDto {
  assetType: AssetType;
  enabled?: boolean;
  thresholdPercent?: number;
  intervalHours?: number;
  updateIntervalHours?: number;
}

export interface UpdateNotificationSettingsDto {
  enabled?: boolean;
  thresholdPercent?: number;
  intervalHours?: number;
  updateIntervalHours?: number;
}
```

### 3. Создать RTK Query API (notificationSettingsSlice.ts)

Endpoints:
- `getNotificationSettings` - GET /notifications/settings
- `createNotificationSettings` - POST /notifications/settings
- `updateNotificationSettings` - PUT /notifications/settings/:id
- `deleteNotificationSettings` - DELETE /notifications/settings/:id

### 4. Создать селекторы и хелперы

```typescript
// Селектор для фильтрации по типу актива
const selectSettingsByAssetType = (settings: NotificationSettings[], assetType: AssetType) => 
  settings.find(s => s.assetType === assetType);
```

### 5. Интегрировать в store

Добавить reducer и middleware в `app/providers/store.ts`.

## Подготовка тесткейсов для TDD

### Unit тесты для API (`__tests__/notificationSettingsApi.test.ts`)

1. **GET notification settings - success**
   - Мокаем ответ с массивом настроек
   - Проверяем корректную обработку данных

2. **GET notification settings - empty array**
   - Мокаем пустой ответ
   - Проверяем обработку пустого массива

3. **POST create settings - success**
   - Мокаем создание настройки
   - Проверяем отправку правильных данных

4. **PUT update settings - success**
   - Мокаем обновление по ID
   - Проверяем отправку правильных данных

5. **DELETE settings - success**
   - Мокаем удаление
   - Проверяем инвалидацию кэша

### Unit тесты для селекторов

6. **selectSettingsByAssetType - finds crypto**
   - Мокаем массив с crypto и nft
   - Проверяем фильтрацию по crypto

7. **selectSettingsByAssetType - finds nft**
   - Мокаем массив с crypto и nft
   - Проверяем фильтрацию по nft

8. **selectSettingsByAssetType - returns undefined if not found**
   - Мокаем массив без нужного типа
   - Проверяем возврат undefined

## Ожидаемый результат

- Файлы созданы в `src/entities/notification-settings/`
- RTK Query API работает с `/notifications/settings`
- Типы экспортируются через Public API
- Селекторы для фильтрации по assetType
- Unit тесты проходят

## Критерии приёмки

- [ ] Создана структура `entities/notification-settings/`
- [ ] Определены типы `NotificationSettings`, `AssetType`, DTOs
- [ ] RTK Query API с endpoints: get, create, update, delete
- [ ] Селектор `selectSettingsByAssetType`
- [ ] API интегрирован в Redux store
- [ ] Unit тесты написаны и проходят
- [ ] Public API экспортирует типы, хуки и селекторы
