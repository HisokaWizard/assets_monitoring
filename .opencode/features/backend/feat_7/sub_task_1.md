# sub_task_1 — HTML-шаблон алерта резкого изменения цены

## Описание задачи

Заменить plain-text шаблон алерта о резком изменении цены на полноценный табличный HTML-шаблон, единый для типов `crypto` и `nft`. Шаблон должен содержать: заголовок, тип актива, название, цену до, цену после и % изменения.

## Затрагиваемые файлы

- `backend/src/notifications/alerts/alerts.service.ts`
- `backend/src/notifications/email/email.service.ts`

## Способ решения

### 1. Обновить интерфейс данных алерта

В `alerts.service.ts` расширить объект `alertsTriggered`:

```typescript
// Было:
{ asset: string; change: string; currentPrice: number }

// Станет:
{
  assetType: 'crypto' | 'nft';
  name: string;          // symbol для crypto, collectionName для nft
  fullName?: string;     // fullName для crypto (опционально)
  nativeToken?: string;  // nativeToken для nft (опционально)
  previousPrice: number;
  currentPrice: number;
  change: string;        // "+" или "-" + число%
}
```

В методе `checkUserAlertsAfterUpdate` при формировании `alertsTriggered.push(...)` добавить `previousPrice` и `assetType`.

### 2. Реализовать `buildAlertHtml()`

Приватный метод, возвращающий строку готового HTML:

```
┌─────────────────────────────────────────────────┐
│  🚨 Срочный отчёт: резкое изменение цены         │
│  Price Alert Report                              │
├────────────┬─────────┬──────────┬───────┬───────┤
│ Тип        │ Актив   │ Цена до  │ Цена  │ %     │
│            │         │          │ после │ изм.  │
├────────────┼─────────┼──────────┼───────┼───────┤
│ CRYPTO     │ BTC     │ $40,000  │$50,000│ +25%  │
│ NFT        │ azuki   │ 10 ETH   │ 7 ETH │ -30%  │
└────────────┴─────────┴──────────┴───────┴───────┘
```

Таблица с inline-стилями (совместимо с email-клиентами).
Цвет % изменения: зеленый при росте, красный при падении.

### 3. Обновить `email.service.ts`

Метод `sendEmail` уже принимает `message: string` и формирует из него HTML.
Добавить опциональный параметр `html?: string`:

```typescript
async sendEmail(to: string, subject: string, message: string, html?: string): Promise<boolean>
```

Если `html` передан — использовать его. Иначе — старое поведение.

### 4. Обновить вызов в `sendAlertEmail()`

```typescript
const html = this.buildAlertHtml(alertsTriggered);
await this.emailService.sendEmail(setting.user.email, subject, plainText, html);
```

## Подготовка тесткейсов для TDD

### Тест 1: `buildAlertHtml` — содержит обязательные секции
```
GIVEN: alertsTriggered с одним crypto-алертом (BTC, previousPrice=40000, currentPrice=50000, change="+25.00")
WHEN: buildAlertHtml() вызван
THEN:
  - HTML содержит "Срочный отчёт"
  - HTML содержит "BTC"
  - HTML содержит "40" (предыдущая цена)
  - HTML содержит "50" (текущая цена)
  - HTML содержит "+25.00"
  - HTML содержит тег <table>
```

### Тест 2: `buildAlertHtml` — crypto отображает USD цены
```
GIVEN: crypto-алерт с previousPrice=1000, currentPrice=1200
WHEN: buildAlertHtml()
THEN: HTML содержит "$1,000" и "$1,200" (форматирование с $ и разделителями)
```

### Тест 3: `buildAlertHtml` — NFT отображает нативный токен
```
GIVEN: nft-алерт с name="azuki", nativeToken="ETH", previousPrice=10, currentPrice=7, change="-30.00"
WHEN: buildAlertHtml()
THEN:
  - HTML содержит "azuki"
  - HTML содержит "ETH"
  - HTML содержит "-30.00"
  - HTML содержит "red" или аналогичный стиль для падения
```

### Тест 4: `buildAlertHtml` — рост цены имеет зеленый цвет
```
GIVEN: change="+25.00"
WHEN: buildAlertHtml()
THEN: HTML содержит "green" в стиле ячейки % изменения
```

### Тест 5: `buildAlertHtml` — падение цены имеет красный цвет
```
GIVEN: change="-15.00"
WHEN: buildAlertHtml()
THEN: HTML содержит "red" в стиле ячейки % изменения
```

### Тест 6: `sendAlertEmail` — передает HTML в emailService
```
GIVEN: alertsTriggered с одним алертом
WHEN: sendAlertEmail() вызван
THEN: emailService.sendEmail вызван с 4 аргументами, 4й - строка содержащая <table>
```

### Тест 7: `checkUserAlertsAfterUpdate` — alertsTriggered содержит previousPrice
```
GIVEN: CryptoAsset с previousPrice=40000, currentPrice=50000, thresholdPercent=5
WHEN: checkUserAlertsAfterUpdate()
THEN: sendAlertEmail вызван с объектом содержащим previousPrice=40000
```

## Ожидаемый результат

- `buildAlertHtml()` возвращает валидный HTML с таблицей
- Письмо получает полноценную HTML-верстку вместо plain-text с `<br>`
- Все поля (заголовок, тип, название, цена до, цена после, %) присутствуют в шаблоне
- Шаблон одинаков структурно для crypto и nft (разница только в данных)

## Критерии приёмки

- [ ] Все 7 тесткейсов проходят (зеленые)
- [ ] `buildAlertHtml` является приватным методом `AlertsService`
- [ ] HTML совместим с email-клиентами (inline-стили, без CSS-классов)
- [ ] `email.service.ts` метод `sendEmail` обратно совместим (html — опциональный параметр)
- [ ] Интерфейс `alertsTriggered` содержит `previousPrice`, `assetType`
