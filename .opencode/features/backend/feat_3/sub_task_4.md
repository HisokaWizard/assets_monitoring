# Sub-task 4: Обновить NotificationsModule и написать тесты

## Описание
Обновить главный модуль notifications для корректной работы с подмодулями, обновить фасадный notifications.service.ts, написать тесты для всех сервисов.

## Способ решения

### Шаг 1: Обновить notifications.module.ts

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([HistoricalPrice, User]),
    ScheduleModule.forRoot(),
    HttpModule,
    forwardRef(() => AssetsModule),
    // Подмодули
    EmailModule,
    SchedulerModule,
    AlertsModule,
    ReportsModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationService,
  ],
  exports: [
    NotificationsService, 
    NotificationService,
  ],
})
export class NotificationsModule {}
```

### Шаг 2: Обновить notifications.service.ts (фасад)

Сервис должен делегировать работу подсервисам:
- CRUD настроек → остается здесь (работа с Repository)
- Проверка алертов → `this.alertsService.checkAlertsAfterUpdate()`
- Генерация отчетов → `this.reportsService.generatePeriodicReports()`
- Отправка email → `this.emailService.sendEmail()`
- Логи → `this.logRepository` (или создать LogService)

### Шаг 3: Обновить notification.service.ts (унифицированный)

Упростить - оставить только:
- `sendNotification(type, user, data)` - unified отправка
- Инъекции: `EmailService`, `AlertsService`, `ReportsService` (если нужно)
- Логирование через `NotificationLog` repository

### Шаг 4: Обновить notifications.controller.ts

Обновить imports:
```typescript
import { CreateNotificationSettingsDto } from './core/dto/create-notification-settings.dto';
import { UpdateNotificationSettingsDto } from './core/dto/update-notification-settings.dto';
import { SendNotificationDto } from './core/dto/send-notification.dto';
import { GenerateReportDto } from './core/dto/generate-report.dto';
```

### Шаг 5: Написать тесты

**AlertsService тесты:**
- `checkAlertsAfterUpdate` - проверка вызова для всех пользователей
- `checkAlertsAfterUpdate` - фильтрация по userId
- Алерт срабатывает при превышении threshold
- Алерт не срабатывает, если не прошел interval

**ReportsService тесты:**
- `generatePeriodicReports` - генерация для всех пользователей
- Правильный расчет daily change
- Правильный расчет weekly change
- Сохранение lastPrice после генерации отчета

**NotificationsService тесты:**
- CRUD настроек (get, create, update, delete)
- Получение истории цен
- Делегирование алертов в AlertsService
- Делегирование отчетов в ReportsService

## Файлы для изменения

**Обновить:**
- `backend/src/notifications/notifications.module.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/notifications/notification.service.ts`
- `backend/src/notifications/notifications.controller.ts`

**Создать тесты:**
- `backend/src/notifications/alerts/alerts.service.spec.ts`
- `backend/src/notifications/reports/reports.service.spec.ts`
- `backend/src/notifications/notifications.service.spec.ts` (обновить)

## Критерии приёмки

### Структура
- [ ] Все файлы на своих местах в новой структуре
- [ ] Удалены устаревшие файлы: `alert.service.ts`, `report.service.ts`
- [ ] Нет дублирования кода между сервисами

### Функциональность
- [ ] Все API endpoints работают корректно
- [ ] Cron задачи запускаются без ошибок
- [ ] Алерты проверяются и отправляются
- [ ] Отчеты генерируются для всех периодов
- [ ] Email отправляется корректно

### Качество кода
- [ ] Каждый сервис < 150 строк (кроме фасада)
- [ ] Четкие границы ответственности
- [ ] Нет циклических зависимостей

### Тесты
- [ ] `alerts.service.spec.ts` - минимум 4 теста, все проходят
- [ ] `reports.service.spec.ts` - минимум 4 теста, все проходят
- [ ] `notifications.service.spec.ts` - обновлен, все проходят
- [ ] Команда `npm test -- notifications` проходит без ошибок

### Сборка
- [ ] `npm run build` - успешно
- [ ] `npm run lint` - без ошибок
- [ ] Приложение запускается: `npm run start:dev`
