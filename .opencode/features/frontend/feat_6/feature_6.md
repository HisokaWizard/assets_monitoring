# Feature 6: Profile Page с настройками пользователя

## Описание

Реализация полноценной страницы профиля пользователя с:
- Отображением информации о пользователе (email, role, createdAt)
- Формой для управления API-ключами (CoinMarketCap, OpenSea)
- Настройками мониторинга раздельно для Crypto и NFT (enabled, thresholdPercent, updateIntervalHours)

## Контекст

### Стек
- **Frontend**: React 18+, TypeScript 5+, Material UI 6, React Router 6, Redux Toolkit
- **Backend**: NestJS с TypeORM, PostgreSQL
- **Архитектура**: FSD (Feature-Sliced Design)

### Существующие API (Backend)

#### UserSettings (`/user-settings`)
- `GET /user-settings` - получить настройки (coinmarketcapApiKey, openseaApiKey)
- `POST /user-settings` - создать настройки
- `PATCH /user-settings` - обновить настройки
- ✅ Защищен JWT Guard

#### NotificationSettings (`/notifications/settings`)
- `GET /notifications/settings` - получить настройки по userId
- `POST /notifications/settings` - создать настройку
- `PUT /notifications/settings/:id` - обновить настройку
- ❌ Не защищен JWT Guard (нужно добавить)

### Модели данных

**UserSettings:**
```typescript
{
  id: number;
  userId: number;
  coinmarketcapApiKey?: string;
  openseaApiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**NotificationSettings:**
```typescript
{
  id: number;
  userId: number;
  assetType: 'crypto' | 'nft';
  enabled: boolean;
  thresholdPercent: number;      // порог % изменения цены
  intervalHours: number;          // интервал проверки
  updateIntervalHours: number;    // интервал обновления активов
  lastNotified?: Date;
}
```

## Декомпозиция

### Sub-task 1: Добавить JWT Guard на бэкенде для notifications/settings
Защитить эндпоинты `/notifications/settings*` авторизацией.

- **Сложность**: Low
- **Зависимости**: Нет
- **Слой**: Backend

### Sub-task 2: Создать API слой и Redux slice для user-settings
- Создать RTK Query API для `/user-settings`
- Создать types для UserSettings
- Создать slice для управления состоянием

- **Сложность**: Medium
- **Зависимости**: Нет
- **Слой**: Frontend (entities/user-settings)

### Sub-task 3: Создать API слой и Redux slice для notification-settings
- Создать RTK Query API для `/notifications/settings`
- Создать types для NotificationSettings
- Создать slice для управления состоянием

- **Сложность**: Medium
- **Зависимости**: Sub-task 1 (JWT Guard)
- **Слой**: Frontend (entities/notification-settings)

### Sub-task 4: Создать компоненты форм для настроек
- `ApiKeysForm` - форма для API ключей
- `MonitoringSettingsForm` - форма для настроек мониторинга (раздельно crypto/nft)
- `UserInfo` - отображение информации о пользователе

- **Сложность**: Medium
- **Зависимости**: Sub-task 2, Sub-task 3
- **Слой**: Frontend (features/profile-settings)

### Sub-task 5: Реализовать ProfilePage и тесты
- Обновить `ProfilePage` с новым функционалом
- Написать unit-тесты для всех компонентов
- Написать E2E тест для страницы профиля

- **Сложность**: Medium
- **Зависимости**: Sub-task 4
- **Слой**: Frontend (pages/profile)

## Ожидаемый результат

1. ProfilePage отображает:
   - Email пользователя
   - Роль (user/admin)
   - Дату создания аккаунта
   - Форму для API ключей (CoinMarketCap, OpenSea)
   - Настройки мониторинга для Crypto (enabled, thresholdPercent, updateIntervalHours)
   - Настройки мониторинга для NFT (enabled, thresholdPercent, updateIntervalHours)

2. Все формы работают с сохранением данных через API
3. JWT Guard защищает `/notifications/settings*` на бэкенде
4. Unit тесты покрывают компоненты и хуки
5. E2E тест проверяет полный сценарий работы с профилем

## Риски

- Бэкенд `/notifications/settings` возвращает массив настроек, нужно фильтровать по assetType
- API ключи хранятся в зашифрованном виде, при возврате бэкендом они могут быть замаскированы
