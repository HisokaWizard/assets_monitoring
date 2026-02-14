# Sub-task 2: Выделить AlertsService

## Описание
Создать AlertsService в `alerts/` папке, перенеся логику проверки алертов из notification.service.ts. Удалить устаревший alert.service.ts.

## Способ решения

### Что переносим из notification.service.ts

**Методы:**
1. `checkAlertsAfterUpdate(userId?, assetIds?)` - публичный метод проверки алертов
2. `checkUserAlertsAfterUpdate(setting, assetIds?)` - приватный метод проверки для пользователя
3. `calculatePriceChange(asset)` - расчет изменения цены
4. `buildAlertMessage(alertsTriggered)` - построение сообщения

**Зависимости:**
- `NotificationSettings` repository
- `NotificationLog` repository  
- `Asset` repository
- `EmailService`

### Структура AlertsService

```typescript
@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(NotificationSettings)
    private readonly settingsRepository: Repository<NotificationSettings>,
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    private readonly emailService: EmailService,
  ) {}

  async checkAlertsAfterUpdate(userId?: number, assetIds?: number[]): Promise<void>
  private async checkUserAlertsAfterUpdate(setting: NotificationSettings, assetIds?: number[]): Promise<void>
  private calculatePriceChange(asset: Asset): number
  private buildAlertMessage(alertsTriggered: Array<{...}>): string
}
```

### Шаги выполнения

1. **Создать alerts.service.ts:**
   - Перенести методы из notification.service.ts
   - Использовать обновленные пути импорта: `../core/entities/...`
   - Сохранить логику проверки интервалов и threshold

2. **Обновить alerts.module.ts:**
   ```typescript
   @Module({
     imports: [TypeOrmModule.forFeature([NotificationSettings, NotificationLog, Asset])],
     providers: [AlertsService],
     exports: [AlertsService],
   })
   export class AlertsModule {}
   ```

3. **Обновить notification.service.ts:**
   - Удалить методы проверки алертов
   - Добавить инъекцию `AlertsService`
   - Делегировать вызов `checkAlertsAfterUpdate` в `AlertsService`

4. **Удалить alert.service.ts** (устаревший)

5. **Обновить imports в других файлах:**
   - Если где-то используется AlertService (notifications.service.ts), заменить на AlertsService

## Файлы для создания/изменения

**Создать:**
- `backend/src/notifications/alerts/alerts.service.ts`

**Обновить:**
- `backend/src/notifications/alerts/alerts.module.ts` (добавить providers, exports)
- `backend/src/notifications/notification.service.ts` (удалить методы алертов, добавить инъекцию AlertsService)
- `backend/src/notifications/notifications.service.ts` (обновить импорты если нужно)

**Удалить:**
- `backend/src/notifications/alert.service.ts`

## Критерии приёмки

- [ ] Создан `alerts.service.ts` с полной логикой проверки алертов
- [ ] `alerts.module.ts` экспортирует `AlertsService`
- [ ] `notification.service.ts` делегирует проверку алертов в `AlertsService`
- [ ] Удален устаревший `alert.service.ts`
- [ ] Все imports обновлены
- [ ] Приложение компилируется: `npm run build`
- [ ] Функциональность алертов работает (можно проверить через API или тесты)
- [ ] Написаны unit тесты для `AlertsService` (минимум 4 теста)
