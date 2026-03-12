# Sub-task 3: Репозитории модуля notifications (NotificationSettingsRepository, NotificationLogRepository, ReportLogRepository)

## Описание

Создать кастомные репозитории для трех сущностей модуля notifications: `NotificationSettings`, `NotificationLog`, `ReportLog`. Перенести все операции с БД из `AlertsService`, `ReportsService`, `NotificationsService` и `NotificationService` в репозитории. Обновить модули и тесты.

## Способ решения

### 1. Создать `NotificationSettingsRepository`

Файл: `backend/src/notifications/core/notification-settings.repository.ts`

Методы для переноса:
- `findEnabledWithUser(userId?: number): Promise<NotificationSettings[]>` — из AlertsService `checkAlertsAfterUpdate()` (строки 74-83, QueryBuilder с leftJoinAndSelect)
- `findByUserId(userId: number): Promise<NotificationSettings[]>` — из NotificationsService `getUserSettings()` (строки 64-67)
- `findOneByUserIdAndAssetType(userId: number, assetType: string): Promise<NotificationSettings | null>` — из NotificationsService `createSettings()` (строки 115-117)
- `createAndSave(data: Partial<NotificationSettings>): Promise<NotificationSettings>` — из NotificationsService `createSettings()` (строки 123-127)
- `updateByIdAndUserId(id: number, userId: number, data: Partial<NotificationSettings>): Promise<void>` — из NotificationsService `updateSettings()` (строка 138)
- `findOneById(id: number): Promise<NotificationSettings | null>` — из NotificationsService `updateSettings()` (строка 139)
- `deleteByIdAndUserId(id: number, userId: number): Promise<number>` — из NotificationsService `deleteSettings()` (строка 146)
- `saveSettings(settings: NotificationSettings): Promise<NotificationSettings>` — из AlertsService (строка 173)
- `findEnabledWithUserRelations(): Promise<NotificationSettings[]>` — из AssetUpdateService `updateAssetsForUsers()` (строки 55-58)

### 2. Создать `NotificationLogRepository`

Файл: `backend/src/notifications/core/notification-log.repository.ts`

Методы для переноса:
- `saveLog(data: Partial<NotificationLog>): Promise<NotificationLog>` — из AlertsService (строки 215-222), ReportsService (строки 254-261), NotificationService (строки 97-104)
- `findByUserIdWithLimit(userId: number, limit: number): Promise<NotificationLog[]>` — из NotificationsService `getNotificationLogs()` (строки 181-186)

### 3. Создать `ReportLogRepository`

Файл: `backend/src/notifications/reports/report-log.repository.ts`

Методы для переноса:
- `findLastByUserIdAndPeriod(userId: number, period: string): Promise<ReportLog | null>` — из ReportsService `canSendReport()` (строки 342-345)
- `saveLog(data: Partial<ReportLog>): Promise<ReportLog>` — из ReportsService (строки 267-272)

### 4. Рефакторинг `AlertsService`

- Заменить `@InjectRepository(NotificationSettings)` на `NotificationSettingsRepository`
- Заменить `@InjectRepository(NotificationLog)` на `NotificationLogRepository`
- Заменить `@InjectRepository(Asset)` — на данном этапе оставить `@InjectRepository()`, замена на `AssetRepository` в sub_task_5

### 5. Рефакторинг `ReportsService`

- Заменить `@InjectRepository(NotificationLog)` на `NotificationLogRepository`
- Заменить `@InjectRepository(ReportLog)` на `ReportLogRepository`
- Заменить `@InjectRepository(Asset)` — оставить `@InjectRepository()`, замена в sub_task_5
- Заменить `@InjectRepository(HistoricalPrice)` — оставить `@InjectRepository()`, замена в sub_task_5

### 6. Рефакторинг `NotificationsService`

- Заменить `@InjectRepository(NotificationSettings)` на `NotificationSettingsRepository`
- Заменить `@InjectRepository(HistoricalPrice)` — оставить `@InjectRepository()`, замена в sub_task_5
- Заменить `@InjectRepository(NotificationLog)` на `NotificationLogRepository`

### 7. Рефакторинг `NotificationService`

- Заменить `@InjectRepository(NotificationSettings)` на `NotificationSettingsRepository`
- Заменить `@InjectRepository(NotificationLog)` на `NotificationLogRepository`
- Заменить `@InjectRepository(Asset)` — оставить `@InjectRepository()`, замена в sub_task_5
- Заменить `@InjectRepository(User)` — оставить `@InjectRepository()`, замена в sub_task_5

### 8. Обновить модули

- `AlertsModule` — добавить `NotificationSettingsRepository`, `NotificationLogRepository` в providers
- `ReportsModule` — добавить `NotificationLogRepository`, `ReportLogRepository` в providers
- `NotificationsModule` — добавить все три репозитория в providers, exports

## Файлы для изменения/создания

- `backend/src/notifications/core/notification-settings.repository.ts` — **СОЗДАТЬ**
- `backend/src/notifications/core/notification-settings.repository.spec.ts` — **СОЗДАТЬ**
- `backend/src/notifications/core/notification-log.repository.ts` — **СОЗДАТЬ**
- `backend/src/notifications/core/notification-log.repository.spec.ts` — **СОЗДАТЬ**
- `backend/src/notifications/reports/report-log.repository.ts` — **СОЗДАТЬ**
- `backend/src/notifications/reports/report-log.repository.spec.ts` — **СОЗДАТЬ**
- `backend/src/notifications/alerts/alerts.service.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/alerts/alerts.service.spec.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/reports/reports.service.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/reports/reports.service.spec.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/notifications.service.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/notification.service.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/alerts/alerts.module.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/reports/reports.module.ts` — **ИЗМЕНИТЬ**
- `backend/src/notifications/notifications.module.ts` — **ИЗМЕНИТЬ**

## Тесткейсы для TDD

### Unit-тесты: NotificationSettingsRepository

```
describe('NotificationSettingsRepository', () => {
  describe('findEnabledWithUser', () => {
    it('should return enabled settings with user relation')
    it('should filter by userId when provided')
    it('should return empty array when no enabled settings')
  })

  describe('findByUserId', () => {
    it('should return settings ordered by assetType ASC, id DESC')
  })

  describe('findOneByUserIdAndAssetType', () => {
    it('should return setting when found')
    it('should return null when not found')
  })

  describe('createAndSave', () => {
    it('should create and save notification settings')
  })

  describe('updateByIdAndUserId', () => {
    it('should update settings matching id and userId')
  })

  describe('findOneById', () => {
    it('should return setting by id')
    it('should return null when not found')
  })

  describe('deleteByIdAndUserId', () => {
    it('should delete and return affected count')
    it('should return 0 when nothing to delete')
  })

  describe('saveSettings', () => {
    it('should save and return the settings entity')
  })

  describe('findEnabledWithUserRelations', () => {
    it('should return enabled settings with user relations for asset update')
  })
})
```

### Unit-тесты: NotificationLogRepository

```
describe('NotificationLogRepository', () => {
  describe('saveLog', () => {
    it('should save notification log entry')
    it('should set correct type and status')
  })

  describe('findByUserIdWithLimit', () => {
    it('should return logs ordered by sentAt DESC')
    it('should limit results')
    it('should return empty array when no logs')
  })
})
```

### Unit-тесты: ReportLogRepository

```
describe('ReportLogRepository', () => {
  describe('findLastByUserIdAndPeriod', () => {
    it('should return last report log for user and period')
    it('should return null when no reports found')
    it('should order by sentAt DESC')
  })

  describe('saveLog', () => {
    it('should save report log entry')
  })
})
```

### Unit-тесты: AlertsService (обновление)

```
describe('AlertsService', () => {
  // Моки: NotificationSettingsRepository, NotificationLogRepository (Asset — пока @InjectRepository)

  describe('checkAlertsAfterUpdate', () => {
    it('should call notificationSettingsRepository.findEnabledWithUser')
  })

  describe('checkUserAlertsAfterUpdate', () => {
    it('should call notificationSettingsRepository.saveSettings after alert')
  })

  describe('sendAlertEmail', () => {
    it('should call notificationLogRepository.saveLog')
  })
})
```

### Unit-тесты: ReportsService (обновление)

```
describe('ReportsService', () => {
  // Моки: NotificationLogRepository, ReportLogRepository (Asset, HistoricalPrice — пока @InjectRepository)

  describe('canSendReport', () => {
    it('should call reportLogRepository.findLastByUserIdAndPeriod')
  })

  describe('sendReportEmail', () => {
    it('should call notificationLogRepository.saveLog')
    it('should call reportLogRepository.saveLog on success')
  })
})
```

## Ожидаемый результат

1. `NotificationSettingsRepository` создан с 9 методами
2. `NotificationLogRepository` создан с 2 методами
3. `ReportLogRepository` создан с 2 методами
4. `AlertsService`, `ReportsService`, `NotificationsService`, `NotificationService` используют кастомные репозитории для своих сущностей
5. Cross-module зависимости (Asset, HistoricalPrice, User) пока остаются через `@InjectRepository()` — будут заменены в sub_task_5
6. Все модули обновлены
7. Все unit-тесты проходят

## Критерии приемки

- [ ] `NotificationSettingsRepository` создан с `@Injectable()` и содержит все методы
- [ ] `NotificationLogRepository` создан с `@Injectable()` и содержит все методы
- [ ] `ReportLogRepository` создан с `@Injectable()` и содержит все методы
- [ ] `AlertsService` использует `NotificationSettingsRepository` и `NotificationLogRepository`
- [ ] `ReportsService` использует `NotificationLogRepository` и `ReportLogRepository`
- [ ] `NotificationsService` использует `NotificationSettingsRepository` и `NotificationLogRepository`
- [ ] `NotificationService` использует `NotificationSettingsRepository` и `NotificationLogRepository`
- [ ] Все модули (AlertsModule, ReportsModule, NotificationsModule) обновлены
- [ ] Все тесты репозиториев проходят
- [ ] Все тесты сервисов проходят с обновленными моками
- [ ] JSDoc документация на всех публичных методах
- [ ] Код соответствует конвенциям
