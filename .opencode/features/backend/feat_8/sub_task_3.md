# sub_task_3: Логика уникальности отчётов

## Описание

Добавить в `ReportsService` метод `canSendReport(userId, period)`,
который проверяет `ReportLog` — прошёл ли полный период с последней отправки.

## Логика

**Периоды блокировки:**
- daily: 24ч
- weekly: 7 суток
- monthly: 30 суток
- quarterly: 90 суток
- yearly: 365 суток

**Алгоритм:**
1. Найти последнюю запись в `report_log` для userId + period
2. Если записи нет → можно отправлять (первый отчёт)
3. Если есть → проверить: `now - lastReport.sentAt >= periodDuration`
4. Вернуть true/false

```typescript
private async canSendReport(userId: number, period: string): Promise<boolean> {
  const lastReport = await this.reportLogRepository.findOne({
    where: { userId, period },
    order: { sentAt: 'DESC' },
  });

  if (!lastReport) return true;

  const minAge = this.getPeriodMinAge(period);
  const elapsed = Date.now() - lastReport.sentAt.getTime();
  return elapsed >= minAge;
}
```

**Вспомогательный метод:**
```typescript
private getPeriodMinAge(period: string): number {
  const ages: Record<string, number> = {
    daily:     24 * 60 * 60 * 1000,
    weekly:     7 * 24 * 60 * 60 * 1000,
    monthly:   30 * 24 * 60 * 60 * 1000,
    quarterly: 90 * 24 * 60 * 60 * 1000,
    yearly:   365 * 24 * 60 * 60 * 1000,
  };
  return ages[period] ?? ages.daily;
}
```

## Тесткейсы для TDD

### TC-1: Первый отчёт (нет записей в ReportLog)
```
Arrange: reportLogRepository.findOne returns null
Act: canSendReport(userId=1, 'daily')
Assert: returns true
```

### TC-2: Прошло достаточно времени
```
Arrange: lastReport.sentAt = 25ч назад, period='daily' (minAge=24ч)
Act: canSendReport(userId=1, 'daily')
Assert: returns true
```

### TC-3: Прошло недостаточно времени
```
Arrange: lastReport.sentAt = 12ч назад, period='daily'
Act: canSendReport(userId=1, 'daily')
Assert: returns false
```

### TC-4: Weekly — граница 7 дней
```
Arrange: lastReport.sentAt = 6д 23ч назад
Act: canSendReport(userId=1, 'weekly')
Assert: returns false

Arrange: lastReport.sentAt = 7д 1ч назад
Assert: returns true
```

## Ожидаемый результат

- Метод `canSendReport` + `getPeriodMinAge` добавлены в ReportsService
- `ReportLog` инжектирован в конструктор

## Критерии приёмки

- Все тесты зелёные
- Повторная отправка заблокирована до истечения полного периода
