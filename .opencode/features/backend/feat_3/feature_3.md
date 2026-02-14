# Feature 3: Декомпозиция модуля Notifications

## Описание задачи

Модуль notifications перегружен - notification.service.ts содержит 390 строк и смешивает логику алертов, отчетов, унифицированных уведомлений и логирования. Кроме того, есть устаревшие дубли alert.service.ts и report.service.ts. Нужно разделить модуль на атомарные подмодули с четкими границами ответственности.

## Текущие проблемы

1. **notification.service.ts** делает слишком много:
   - Проверка алертов после обновлений (`checkAlertsAfterUpdate`)
   - Генерация периодических отчетов (`generatePeriodicReports`)
   - Унифицированная отправка уведомлений (`sendNotification`)
   - Расчет изменений цен и построение сообщений
   - Работа с репозиториями (Settings, Log, Assets, User)

2. **Дублирование кода**: alert.service.ts и report.service.ts содержат похожую логику, но не используют unified notification

3. **Всё в одной папке**: 14 файлов в корне модуля без структуры

## Целевая структура

```
notifications/
├── core/
│   ├── entities/
│   │   ├── notification-settings.entity.ts
│   │   └── notification-log.entity.ts
│   └── dto/
│       ├── create-notification-settings.dto.ts
│       ├── update-notification-settings.dto.ts
│       └── send-notification.dto.ts
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.service.ts          # Проверка алертов, расчет изменений
│   └── dto/
│       └── alert-data.dto.ts
├── reports/
│   ├── reports.module.ts
│   ├── reports.service.ts         # Генерация периодических отчетов
│   └── dto/
│       ├── generate-report.dto.ts
│       └── report-data.dto.ts
├── email/
│   ├── email.module.ts
│   └── email.service.ts           # Отправка email через nodemailer
├── scheduler/
│   ├── scheduler.module.ts
│   └── scheduler.service.ts       # Cron задачи
├── notifications.module.ts        # Root модуль
├── notifications.controller.ts    # API endpoints
└── notifications.service.ts       # Фасад, unified notification
```

## Декомпозиция

1. **Создать структуру директорий и перенести базовые компоненты**
   - Создать папки: `core/entities`, `core/dto`, `alerts`, `reports`, `email`, `scheduler`
   - Перенести entities и dto в `core/`
   - Перенести `email.service.ts` → `email/`
   - Перенести `scheduler.service.ts` → `scheduler/`

2. **Выделить AlertsService**
   - Создать `alerts/alerts.service.ts` с логикой проверки алертов
   - Перенести из `notification.service.ts`: `checkAlertsAfterUpdate`, `checkUserAlertsAfterUpdate`, `calculatePriceChange`, `buildAlertMessage`
   - Удалить устаревший `alert.service.ts`

3. **Выделить ReportsService**
   - Создать `reports/reports.service.ts` с логикой генерации отчетов
   - Перенести из `notification.service.ts`: `generatePeriodicReports`, `generateUserPeriodicReport`, `getLastPriceForPeriod`, `setLastPriceForPeriod`, `getCurrentPrice`, `buildReportMessage`
   - Удалить устаревший `report.service.ts`

4. **Обновить NotificationsModule и связи**
   - Обновить `notifications.module.ts` для импорта подмодулей
   - Обновить `notifications.service.ts` - оставить только фасад и unified notification
   - Обновить импорты в `notifications.controller.ts` и `scheduler.service.ts`

5. **Написать тесты**
   - Unit тесты для `AlertsService`
   - Unit тесты для `ReportsService`
   - Unit тесты для обновленного `NotificationsService`

## Оценка сложности

Средняя-высокая (3-4 часа)

- Рефакторинг существующего кода требует аккуратности
- Нужно сохранить всю существующую функциональность
- Обновить множество импортов
- Написать тесты для новой структуры

## Зависимости

- Модуль assets (AssetUpdateService) - используется в SchedulerService
- Entities: NotificationSettings, NotificationLog, Asset, User, HistoricalPrice
- EmailService используется AlertsService, ReportsService и NotificationsService

## Существующие файлы для рефакторинга

- `notifications.module.ts` - обновить imports и providers
- `notifications.service.ts` - разделить логику
- `notification.service.ts` - переименовать/объединить
- `alert.service.ts` - удалить (устаревший)
- `report.service.ts` - удалить (устаревший)
- `email.service.ts` - перенести в `email/`
- `scheduler.service.ts` - перенести в `scheduler/`
- `notifications.controller.ts` - обновить imports
- Entities и DTO - перенести в `core/`

## Критерии приёмки

- [ ] Модуль разделен на подмодули: alerts, reports, email, scheduler
- [ ] Каждый сервис имеет четкую зону ответственности
- [ ] Удалены устаревшие alert.service.ts и report.service.ts
- [ ] Все существующие endpoint'ы работают корректно
- [ ] Все существующие cron задачи работают корректно
- [ ] Unit тесты проходят для всех сервисов
- [ ] Нет циклических зависимостей между модулями

## Создано
2026-02-14
