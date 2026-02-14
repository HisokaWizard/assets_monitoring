# Sub-task 3: Выделить ReportsService

## Описание
Создать ReportsService в `reports/` папке, перенеся логику генерации отчетов из notification.service.ts. Удалить устаревший report.service.ts.

## Способ решения

### Что переносим из notification.service.ts

**Методы:**
1. `generatePeriodicReports(period)` - генерация отчетов для всех пользователей
2. `generateUserPeriodicReport(userId, period)` - генерация отчета для одного пользователя
3. `getLastPriceForPeriod(asset, period)` - получение цены за период
4. `setLastPriceForPeriod(asset, period, price)` - установка цены за период
5. `getCurrentPrice(asset)` - получение текущей цены
6. `buildReportMessage(reportData, period)` - построение сообщения отчета

**Зависимости:**
- `NotificationLog` repository
- `Asset` repository
- `EmailService`

### Структура ReportsService

```typescript
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    private readonly emailService: EmailService,
  ) {}

  async generatePeriodicReports(period: string): Promise<void>
  private async generateUserPeriodicReport(userId: number, period: string): Promise<void>
  private getLastPriceForPeriod(asset: Asset, period: string): number | null
  private setLastPriceForPeriod(asset: Asset, period: string, price: number): void
  private getCurrentPrice(asset: Asset): number
  private buildReportMessage(reportData: Array<{...}>, period: string): string
}
```

### Шаги выполнения

1. **Создать reports.service.ts:**
   - Перенести методы из notification.service.ts
   - Использовать обновленные пути импорта: `../core/entities/...`
   - Сохранить логику расчета изменений за период

2. **Обновить reports.module.ts:**
   ```typescript
   @Module({
     imports: [TypeOrmModule.forFeature([NotificationLog, Asset])],
     providers: [ReportsService],
     exports: [ReportsService],
   })
   export class ReportsModule {}
   ```

3. **Обновить notification.service.ts:**
   - Удалить методы генерации отчетов
   - Добавить инъекцию `ReportsService`
   - Делегировать вызов `generatePeriodicReports` в `ReportsService`

4. **Удалить report.service.ts** (устаревший)

5. **Обновить scheduler.service.ts:**
   - Обновить импорты, если используется ReportsService
   - Проверить, что вызовы `generatePeriodicReports` работают корректно

## Файлы для создания/изменения

**Создать:**
- `backend/src/notifications/reports/reports.service.ts`

**Обновить:**
- `backend/src/notifications/reports/reports.module.ts` (добавить providers, exports)
- `backend/src/notifications/notification.service.ts` (удалить методы отчетов, добавить инъекцию ReportsService)
- `backend/src/notifications/scheduler/scheduler.service.ts` (обновить импорты если нужно)

**Удалить:**
- `backend/src/notifications/report.service.ts`

## Критерии приёмки

- [ ] Создан `reports.service.ts` с полной логикой генерации отчетов
- [ ] `reports.module.ts` экспортирует `ReportsService`
- [ ] `notification.service.ts` делегирует генерацию отчетов в `ReportsService`
- [ ] Удален устаревший `report.service.ts`
- [ ] Все imports обновлены
- [ ] Приложение компилируется: `npm run build`
- [ ] Функциональность отчетов работает (daily, weekly, monthly, quarterly, yearly)
- [ ] Написаны unit тесты для `ReportsService` (минимум 4 теста)
