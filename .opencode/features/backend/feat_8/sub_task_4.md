# sub_task_4: HTML-шаблон отчёта

## Описание

Добавить в `ReportsService` метод `buildReportHtml(reportData, period)`,
формирующий HTML-письмо в табличном виде по аналогии с `buildAlertHtml()` в alerts.service.ts.

## Структура таблицы

**Заголовок письма:** "Portfolio [Period] Report"
**Подзаголовок:** период (например, "Daily report — last 24 hours")
**Цвет шапки:** тёмно-синий `#1a3a5c` (отличается от красного алерта)

**Колонки таблицы:**
| Type | Asset | Price [N period] ago | Current Price | Change |
|------|-------|---------------------|---------------|--------|
| CRYPTO | BTC / Bitcoin | $48,000 | $50,000 | +4.17% |
| NFT | boredapeyachtclub / ETH | 12 ETH | 12.5 ETH | +4.17% |

**Данные:**
- `lastPrice` = asset.dailyPrice/weeklyPrice/... (снапшот цены начала периода)
- `currentPrice` = текущая цена
- `change` = ((current - last) / last) * 100

**Форматирование:**
- Crypto: `$` + toLocaleString('en-US', { maximumFractionDigits: 4 })
- NFT: toLocaleString + ` ETH` (или nativeToken)
- Change: цвет green если ≥ 0, red если < 0

## Interface reportData

```typescript
interface ReportItem {
  assetType: 'crypto' | 'nft';
  name: string;           // symbol или collectionName
  fullName?: string;      // для crypto
  nativeToken?: string;   // для nft
  lastPrice: number | null;  // цена начала периода (null если первый отчёт)
  currentPrice: number;
  change: number;         // % изменение (число)
  totalValue: number;
}
```

## Подпись периода в заголовке

```typescript
const periodLabels: Record<string, string> = {
  daily:     'Daily report — last 24 hours',
  weekly:    'Weekly report — last 7 days',
  monthly:   'Monthly report — last 30 days',
  quarterly: 'Quarterly report — last 90 days',
  yearly:    'Yearly report — last 365 days',
};
```

## Тесткейсы для TDD

### TC-1: HTML содержит правильные данные для crypto актива
```
Arrange: reportItem = { assetType: 'crypto', name: 'BTC', fullName: 'Bitcoin', lastPrice: 48000, currentPrice: 50000, change: 4.17 }
Act: buildReportHtml([reportItem], 'daily')
Assert: html содержит 'BTC', 'Bitcoin', '$48,000', '$50,000', '+4.17%'
Assert: html содержит 'color: green' (позитивное изменение)
```

### TC-2: Отрицательное изменение — красный цвет
```
Arrange: change = -5.0
Assert: html содержит 'color: red', '-5.00%'
```

### TC-3: NFT с нативным токеном
```
Arrange: { assetType: 'nft', name: 'boredapeyachtclub', nativeToken: 'ETH', lastPrice: 12, currentPrice: 12.5, change: 4.17 }
Assert: html содержит 'ETH' в ценах, не '$'
```

### TC-4: lastPrice = null (первый отчёт)
```
Arrange: lastPrice = null
Assert: html содержит 'N/A' или '-' в колонке "Price ago", change = 0 или 'N/A'
```

### TC-5: Заголовок содержит правильный период
```
Assert: buildReportHtml([], 'weekly') содержит 'Weekly report'
Assert: buildReportHtml([], 'monthly') содержит 'Monthly report'
```

## Ожидаемый результат

- Метод `buildReportHtml` добавлен в ReportsService
- HTML валиден, inline-стили совместимы с email-клиентами

## Критерии приёмки

- Все TC зелёные
- Визуально аналогично buildAlertHtml (таблица с хедером и футером)
- Plain-text версия buildReportMessage остаётся для fallback
