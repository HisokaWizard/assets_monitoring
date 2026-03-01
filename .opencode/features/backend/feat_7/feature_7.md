# feat_7 — Улучшение шаблона срочного алерта и валидация логики отработки

## Описание задачи

Доработать систему срочных уведомлений о резком изменении цены активов:

1. **Шаблон письма**: Заменить plain-text шаблон `buildAlertMessage` в `alerts.service.ts` на табличный HTML-шаблон, единый для crypto и NFT, с заголовком, названием актива, % изменения, ценой до и ценой после.
2. **Логика отработки**: Проверить и исправить логику использования `updateIntervalHours` — сравнение цены должно производиться за период `updateIntervalHours` (т.е. `previousPrice` фиксируется при каждом обновлении), а кулдаун уведомлений управляется `intervalHours`. Поле `updateIntervalHours` должно использоваться для понимания временного окна изменения.

## Контекст

### Текущий шаблон (plain-text, `alerts.service.ts:186-197`)
```typescript
private buildAlertMessage(alertsTriggered): string {
  let message = 'Sharp price changes detected:\n\n';
  for (const alert of alertsTriggered) {
    message += `${alert.asset}: ${alert.change}% change, Current price: $${alert.currentPrice}\n`;
  }
  message += '\nPlease check your portfolio for more details.';
  return message;
}
```

### Email-сервис (`email.service.ts:66-88`)
- Принимает `text` и `html` отдельно
- Сейчас HTML это `<p>${message.replace(/\n/g, '<br>')}</p>` — нет полноценной верстки
- **Нужно**: передавать готовый HTML в отдельном параметре или доработать интерфейс

### Данные для шаблона алерта

**Crypto** (`CryptoAsset`):
- Название: `asset.symbol` + `asset.fullName`
- Текущая цена: `asset.currentPrice` (USD)
- Предыдущая цена: `asset.previousPrice`

**NFT** (`NFTAsset`):
- Название: `asset.collectionName`
- Токен: `asset.nativeToken`
- Текущая цена: `asset.floorPrice` (нативный токен) + `asset.floorPriceUsd` (USD)
- Предыдущая цена: `asset.previousPrice` (нативный токен)

### Поля алерта (обязательные)
| Поле | Описание |
|------|----------|
| Заголовок | "Срочный отчёт: резкое изменение цены" |
| Тип актива | crypto / nft |
| Название | symbol (crypto) / collectionName (nft) |
| Цена до | previousPrice |
| Цена после | currentPrice / floorPrice |
| % изменения | рассчитанный change |

### Логика отработки (текущий анализ `alerts.service.ts:82-131`)

**Проблема**: `previousPrice` в `asset.entity.ts` обновляется при каждом вызове `updateCryptoAsset` / `updateNFTAsset` — это значит изменение вычисляется именно за `updateIntervalHours` (интервал обновления). Это **корректное поведение**.

**Текущая логика** (`checkUserAlertsAfterUpdate`):
1. Кулдаун: `intervalHours` — минимальный интервал между уведомлениями ✅
2. Порог: `thresholdPercent` — % изменения для срабатывания ✅
3. `previousPrice` фиксирует цену на момент предыдущего обновления = изменение за `updateIntervalHours` ✅

**Итог**: Бизнес-логика корректна. Нужно только добавить в email-шаблон поле "цена до" (`previousPrice`) которого сейчас нет в `alertsTriggered`.

## Декомпозиция

### sub_task_1.md — HTML-шаблон алерта
- Доработать интерфейс `alertsTriggered` — добавить `previousPrice`, `assetType`, `fullName`/`nativeToken`
- Реализовать `buildAlertHtml()` — табличный HTML единый для crypto/NFT
- Обновить `sendAlertEmail()` чтобы передавать HTML в `emailService.sendEmail`
- Обновить `email.service.ts` для поддержки явного html-параметра

### sub_task_2.md — Валидация логики и тесты
- Проверить тесты `alerts.service.spec.ts` на покрытие новых полей
- Дописать тесткейсы: шаблон содержит previousPrice; crypto vs NFT форматирование; thresholdPercent = 0; change = 0

## Оценка сложности

**Medium** — 2 sub-tasks, изменения в 2 файлах (alerts.service.ts, email.service.ts) + тесты.

## Зависимости

- `backend/src/notifications/alerts/alerts.service.ts`
- `backend/src/notifications/email/email.service.ts`
- `backend/src/notifications/alerts/alerts.service.spec.ts`
- `backend/src/assets/asset.entity.ts` (только для чтения типов)
