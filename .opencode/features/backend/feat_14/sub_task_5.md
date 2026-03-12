# Sub-task 5: Интеграция cross-module зависимостей и регрессионные тесты

## Описание

Заменить все оставшиеся `@InjectRepository()` на кастомные репозитории в cross-module зависимостях. Обновить импорты модулей для корректного экспорта/импорта репозиториев. Провести полную регрессию: запустить все тесты, убедиться что нет `@InjectRepository()` в сервисах.

## Зависимости

**Зависит от:** sub_task_1, sub_task_2, sub_task_3, sub_task_4 (все должны быть завершены).

## Способ решения

### 1. Заменить оставшиеся `@InjectRepository()` в `AssetUpdateService`

В sub_task_2 были оставлены:
- `@InjectRepository(User)` -> заменить на `UserRepository` (из auth модуля)
- `@InjectRepository(NotificationSettings)` -> заменить на `NotificationSettingsRepository` (из notifications модуля)

### 2. Заменить оставшиеся `@InjectRepository()` в `AlertsService`

В sub_task_3 были оставлены:
- `@InjectRepository(Asset)` -> заменить на `AssetRepository` (из assets модуля)

### 3. Заменить оставшиеся `@InjectRepository()` в `ReportsService`

В sub_task_3 были оставлены:
- `@InjectRepository(Asset)` -> заменить на `AssetRepository` (из assets модуля)
- `@InjectRepository(HistoricalPrice)` -> заменить на `HistoricalPriceRepository` (из assets модуля)

### 4. Заменить оставшиеся `@InjectRepository()` в `NotificationsService`

В sub_task_3 были оставлены:
- `@InjectRepository(HistoricalPrice)` -> заменить на `HistoricalPriceRepository` (из assets модуля)

### 5. Заменить оставшиеся `@InjectRepository()` в `NotificationService`

В sub_task_3 были оставлены:
- `@InjectRepository(Asset)` -> заменить на `AssetRepository` (из assets модуля)
- `@InjectRepository(User)` -> заменить на `UserRepository` (из auth модуля)

### 6. Обновить импорты модулей

**AssetsModule:**
- Должен импортировать `AuthModule` (для `UserRepository`) — если еще не импортирует
- Должен импортировать notifications core репозитории — через `NotificationsModule` или напрямую
- **ВАЖНО:** Проверить circular dependencies. `AssetsModule` уже используется в `NotificationsModule` через `forwardRef`. Нужно аккуратно обработать.

**Решение circular dependency:**
- `AssetUpdateService` инжектит `NotificationSettingsRepository` — это cross-module зависимость
- Вариант 1: Вынести `NotificationSettingsRepository` в отдельный shared модуль
- Вариант 2: Использовать `forwardRef()` для импорта
- Вариант 3: Экспортировать `NotificationSettingsRepository` из `NotificationsModule` и использовать `forwardRef` в `AssetsModule`
- **Рекомендация:** Вариант 3 — минимальные изменения, уже есть `forwardRef` между модулями

**NotificationsModule:**
- Должен импортировать `AssetsModule` (для `AssetRepository`, `HistoricalPriceRepository`) — уже импортирует через `forwardRef`
- Должен импортировать `AuthModule` (для `UserRepository`) — уже импортирует через `forwardRef`

**AlertsModule:**
- Должен импортировать `AssetsModule` (для `AssetRepository`)

**ReportsModule:**
- Должен импортировать `AssetsModule` (для `AssetRepository`, `HistoricalPriceRepository`)

### 7. Очистка `TypeOrmModule.forFeature()`

После замены всех `@InjectRepository()` в сервисах, `TypeOrmModule.forFeature()` нужен только в модулях, где определены кастомные репозитории:
- `AuthModule`: `TypeOrmModule.forFeature([User])` — для `UserRepository`
- `AssetsModule`: `TypeOrmModule.forFeature([Asset, CryptoAsset, NFTAsset, HistoricalPrice])` — для `AssetRepository`, `HistoricalPriceRepository`
- `NotificationsModule`: `TypeOrmModule.forFeature([NotificationSettings, NotificationLog])` — для репозиториев
- `AlertsModule`: убрать `TypeOrmModule.forFeature([...])` если все entity доступны через импорт модулей
- `ReportsModule`: аналогично
- `UserSettingsModule`: `TypeOrmModule.forFeature([UserSettings])` — для `UserSettingsRepository`

**ВАЖНО:** Не удалять `TypeOrmModule.forFeature()` из модулей, где определены репозитории — он нужен для `@InjectRepository()` внутри кастомных репозиториев.

### 8. Финальная проверка

- Grep по всему `backend/src/` на `@InjectRepository` — должен быть ТОЛЬКО в файлах `*.repository.ts`
- Запуск всех тестов: `npm test`
- Проверка coverage >= 80%

## Файлы для изменения

- `backend/src/assets/asset-update.service.ts` — **ИЗМЕНИТЬ** (заменить оставшиеся @InjectRepository)
- `backend/src/assets/asset-update.service.spec.ts` — **ИЗМЕНИТЬ** (обновить моки)
- `backend/src/notifications/alerts/alerts.service.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/alerts/alerts.service.spec.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/reports/reports.service.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/reports/reports.service.spec.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/notifications.service.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/notification.service.ts` — **ИЗМЕНИТЬ**
- `backend/src/assets/assets.module.ts` — **ИЗМЕНИТЬ** (импорты, forFeature cleanup)
- `backend/src/notifications/notifications.module.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/alerts/alerts.module.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/reports/reports.module.ts` — **ИЗМЕНИТЬ**
- `backend/src/auth/auth.module.ts` — **ИЗМЕНИТЬ** (убедиться что exports содержит UserRepository)

## Тесткейсы для TDD

### Регрессионные тесты

```
describe('Repository Pattern Integration', () => {
  describe('No @InjectRepository in services', () => {
    it('should not have @InjectRepository in any service file')
    // Проверка: grep -r "@InjectRepository" backend/src/ --include="*.service.ts" должен вернуть 0 результатов
  })

  describe('@InjectRepository only in repositories', () => {
    it('should have @InjectRepository only in *.repository.ts files')
    // Проверка: grep -r "@InjectRepository" backend/src/ должен вернуть только *.repository.ts файлы
  })
})
```

### Unit-тесты: AssetUpdateService (финальное обновление)

```
describe('AssetUpdateService (final)', () => {
  // Все моки — кастомные репозитории, никаких Repository<Entity>

  describe('updateAssetsForUsers', () => {
    it('should use notificationSettingsRepository.findEnabledWithUserRelations')
    it('should use userRepository (from auth) to save lastUpdated')
    it('should use assetRepository.findByUserId')
    it('should use assetRepository.saveAsset')
    it('should use historicalPriceRepository.savePrice')
  })
})
```

### Unit-тесты: AlertsService (финальное обновление)

```
describe('AlertsService (final)', () => {
  // Все моки — кастомные репозитории

  describe('checkUserAlertsAfterUpdate', () => {
    it('should use assetRepository.findByUserIdWithQueryBuilder')
  })
})
```

### Unit-тесты: ReportsService (финальное обновление)

```
describe('ReportsService (final)', () => {
  // Все моки — кастомные репозитории

  describe('generatePeriodicReports', () => {
    it('should use assetRepository.findDistinctUserIds')
  })

  describe('generateUserPeriodicReport', () => {
    it('should use historicalPriceRepository.countOlderThan')
    it('should use assetRepository.findByUserIdWithRelations')
    it('should use assetRepository.saveMany')
  })
})
```

### Unit-тесты: NotificationsService (финальное обновление)

```
describe('NotificationsService (final)', () => {
  // Все моки — кастомные репозитории

  describe('getAssetHistory', () => {
    it('should use historicalPriceRepository.findByAssetIdWithLimit')
  })
})
```

### Unit-тесты: NotificationService (финальное обновление)

```
describe('NotificationService (final)', () => {
  // Все моки — кастомные репозитории

  describe('constructor', () => {
    it('should inject AssetRepository instead of Repository<Asset>')
    it('should inject UserRepository instead of Repository<User>')
  })
})
```

### E2E / Smoke тесты

```
describe('Full regression', () => {
  it('all existing tests should pass (npm test)')
  it('no TypeScript compilation errors (npx tsc --noEmit)')
  it('coverage >= 80%')
})
```

## Ожидаемый результат

1. **Ни один сервис** не содержит `@InjectRepository()` — только кастомные репозитории
2. `@InjectRepository()` используется **только** внутри `*.repository.ts` файлов
3. Все модули корректно импортируют/экспортируют кастомные репозитории
4. Circular dependencies обработаны через `forwardRef()`
5. `TypeOrmModule.forFeature()` присутствует только в модулях с репозиториями
6. Все тесты проходят
7. Coverage >= 80%
8. Нет TypeScript ошибок компиляции

## Критерии приемки

- [ ] `grep -r "@InjectRepository" backend/src/ --include="*.service.ts"` возвращает 0 результатов
- [ ] `grep -r "@InjectRepository" backend/src/` возвращает только `*.repository.ts` файлы
- [ ] Все модули корректно настроены (imports, providers, exports)
- [ ] Нет circular dependency ошибок при запуске приложения
- [ ] `npm test` — все тесты проходят
- [ ] `npx tsc --noEmit` — нет ошибок компиляции
- [ ] Coverage >= 80%
- [ ] Все cross-module зависимости используют кастомные репозитории
