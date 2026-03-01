# sub_task_2: Логика проверки исторических данных

## Описание

Добавить в `ReportsService` приватный метод `hasEnoughHistory(userId, period)`,
который проверяет что в таблице `historical_price` есть хотя бы одна запись
с timestamp старше минимального порога для данного периода.

## Реализация

**Минимальные возрасты записей:**
- daily: 24ч (86400000 мс)
- weekly: 7д (604800000 мс)
- monthly: 30д (2592000000 мс)
- quarterly: 90д (7776000000 мс)
- yearly: 365д (31536000000 мс)

**Метод:**
```typescript
private async hasEnoughHistory(userId: number, period: string): Promise<boolean> {
  const minAge = this.getPeriodMinAge(period);
  const threshold = new Date(Date.now() - minAge);

  // Найти хотя бы одну запись исторической цены для активов пользователя,
  // которая старше threshold
  const count = await this.historicalPriceRepository
    .createQueryBuilder('hp')
    .innerJoin('hp.asset', 'asset')
    .where('asset.userId = :userId', { userId })
    .andWhere('hp.timestamp <= :threshold', { threshold })
    .getCount();

  return count > 0;
}
```

**Инжектировать:** `@InjectRepository(HistoricalPrice)` в конструктор ReportsService.

## Тесткейсы для TDD

### TC-1: Достаточно данных для daily
```
Arrange: mock historicalPriceRepository возвращает count=1 при запросе с threshold=24ч назад
Act: hasEnoughHistory(userId=1, 'daily')
Assert: возвращает true
```

### TC-2: Нет данных для daily
```
Arrange: mock возвращает count=0
Act: hasEnoughHistory(userId=1, 'daily')
Assert: возвращает false
```

### TC-3: Правильный threshold для каждого периода
```
Assert: для 'weekly' threshold = ~7д назад
Assert: для 'monthly' threshold = ~30д назад
Assert: для 'quarterly' threshold = ~90д назад
Assert: для 'yearly' threshold = ~365д назад
```

## Ожидаемый результат

- Метод `hasEnoughHistory` добавлен в ReportsService
- `HistoricalPrice` инжектирован в конструктор
- Запрос корректно фильтрует по userId через join с asset

## Критерии приёмки

- Все тесты зелёные
- Метод вернёт false если данных недостаточно → отчёт не отправляется
