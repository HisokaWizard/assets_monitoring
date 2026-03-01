# feat_8: Новый шаблон отчётов + учёт уникальности + проверка исторических данных

## Описание задачи

Переработать систему периодических отчётов (daily, weekly, monthly, quarterly, yearly):

1. **Единый HTML-шаблон** — табличная форма по аналогии с Price Alert (alerts.service.ts).
   Колонки: Тип | Актив | Цена N дней/недель/... назад | Текущая цена | % изменения

2. **Учёт уникальности отчётов** — новая таблица `report_log` (ReportLog entity):
   - userId, period, sentAt
   - Блокировка повторной отправки: следующий daily только через 24ч после последнего,
     weekly — через 7д, monthly — 30д, quarterly — 90д, yearly — 365д

3. **Проверка наличия исторических данных** — отчёт отправляется только если
   в `historical_price` есть хотя бы 1 запись ≥24ч назад (для daily),
   ≥7д (weekly), ≥30д (monthly), ≥90д (quarterly), ≥365д (yearly).
   Обе условия должны выполняться одновременно.

## Контекст (из анализа кода)

- `reports.service.ts` — текущий сервис, plain-text шаблон, нет HTML, нет проверок
- `alerts.service.ts` — эталонный HTML шаблон `buildAlertHtml()` с inline-стилями
- `asset.entity.ts` — поля dailyPrice/weeklyPrice/.../yearPrice хранят цену начала периода
- `historical-price.entity.ts` — таблица historical_price (assetId, price, timestamp)
- `notification-log.entity.ts` — существующий лог, но не для учёта периодов отчётов
- `scheduler.service.ts` — cron-джобы: daily каждые 4ч, weekly по пн, monthly 1-го, etc.

## Декомпозиция

### sub_task_1: Создать сущность ReportLog
Новая таблица `report_log` для учёта отправленных отчётов.

### sub_task_2: Реализовать логику проверки исторических данных
Метод `hasEnoughHistory(userId, period)` — проверяет наличие записей в historical_price
на требуемую глубину для каждого периода.

### sub_task_3: Реализовать логику уникальности отчётов
Метод `canSendReport(userId, period)` — проверяет ReportLog, блокирует повторную отправку
пока не пройдёт полный период с момента последней отправки.

### sub_task_4: Создать HTML-шаблон отчёта
Метод `buildReportHtml(reportData, period)` — табличный HTML по аналогии с buildAlertHtml().
Колонки: Type | Asset | Price N period ago | Current Price | Change %.
Цена period-ago берётся из asset.dailyPrice/weeklyPrice и т.д. (снапшот начала периода).

### sub_task_5: Интегрировать всё в generateUserPeriodicReport
Обновить `generateUserPeriodicReport` и `sendReportEmail`:
- Добавить проверку hasEnoughHistory
- Добавить проверку canSendReport
- Передавать HTML в emailService.sendEmail
- Сохранять запись в ReportLog после успешной отправки
- Зарегистрировать ReportLog в модуле

## Оценка сложности

Medium — 5 атомарных операций, новая entity + миграция (synchronize: true), изменения в сервисе.

## Зависимости

- Нет зависимостей от других незавершённых задач
- ReportLog нужен до sub_task_2-5
