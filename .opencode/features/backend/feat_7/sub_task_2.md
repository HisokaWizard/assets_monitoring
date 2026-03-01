# sub_task_2 — Валидация логики alerts.service.ts (updateIntervalHours + thresholdPercent)

## Описание задачи

Проверить корректность бизнес-логики срочного алерта:
1. **`updateIntervalHours`** — временное окно, за которое фиксируется изменение цены (через `previousPrice`)
2. **`thresholdPercent`** — порог в % для срабатывания алерта
3. **`intervalHours`** — кулдаун между уведомлениями

Исправить использование `updateIntervalHours` в `asset-update.service.ts` (сейчас используется `intervalHours` там где должен быть `updateIntervalHours`).

## Текущее состояние

### `asset-update.service.ts:81-87`
```typescript
// Сейчас — использует intervalHours (кулдаун алерта) для определения интервала обновления:
const intervalHours =
  userSettings.length > 0 ? Math.max(...userSettings.map((s) => s.intervalHours)) : 4;

const shouldUpdate =
  !user.lastUpdated ||
  now.getTime() - user.lastUpdated.getTime() >= intervalHours * 60 * 60 * 1000;
```

### Что должно быть
Интервал обновления активов (`shouldUpdate`) должен использовать `updateIntervalHours`:
```typescript
const updateIntervalHours =
  userSettings.length > 0 ? Math.max(...userSettings.map((s) => s.updateIntervalHours)) : 4;

const shouldUpdate =
  !user.lastUpdated ||
  now.getTime() - user.lastUpdated.getTime() >= updateIntervalHours * 60 * 60 * 1000;
```

### `alerts.service.ts:82`
```typescript
// Кулдаун — использует intervalHours. Это правильно:
const intervalMs = setting.intervalHours * 60 * 60 * 1000;
```

### Связь полей
- `updateIntervalHours` — как часто обновляем цены из API → определяет окно изменения для `previousPrice`
- `intervalHours` — как часто шлём уведомления (кулдаун)
- `thresholdPercent` — порог % изменения для срабатывания

## Способ решения

1. Исправить `asset-update.service.ts` — заменить `intervalHours` → `updateIntervalHours` в расчёте `shouldUpdate`
2. Добавить тесты в `alerts.service.spec.ts` для граничных случаев `thresholdPercent`
3. Добавить тесты в `asset-update.service.spec.ts` для проверки что `updateIntervalHours` используется для расчёта `shouldUpdate`

## Подготовка тесткейсов для TDD

### Тест 1: `alerts.service` — точно на пороге (thresholdPercent = exactly change)
```
GIVEN: thresholdPercent=25, change=25% (previousPrice=40000, currentPrice=50000)
WHEN: checkUserAlertsAfterUpdate()
THEN: emailService.sendEmail ВЫЗВАН (Math.abs(25) >= 25 → true)
```

### Тест 2: `alerts.service` — ниже порога не срабатывает
```
GIVEN: thresholdPercent=25, change=24.99% (previousPrice=40000, currentPrice=49996)
WHEN: checkUserAlertsAfterUpdate()
THEN: emailService.sendEmail НЕ ВЫЗВАН
```

### Тест 3: `alerts.service` — падение цены срабатывает (отрицательное изменение)
```
GIVEN: thresholdPercent=10, previousPrice=50000, currentPrice=40000 (change=-20%)
WHEN: checkUserAlertsAfterUpdate()
THEN: emailService.sendEmail ВЫЗВАН (Math.abs(-20) >= 10 → true)
```

### Тест 4: `alerts.service` — previousPrice=0 не вызывает алерт
```
GIVEN: CryptoAsset с previousPrice=0, currentPrice=50000
WHEN: checkUserAlertsAfterUpdate()
THEN: emailService.sendEmail НЕ ВЫЗВАН (calculatePriceChange returns 0)
```

### Тест 5: `alerts.service` — NFT алерт по floorPrice
```
GIVEN: NFTAsset с previousPrice=10, floorPrice=7, thresholdPercent=10 → change=-30%
WHEN: checkUserAlertsAfterUpdate() с assetType='nft'
THEN: emailService.sendEmail ВЫЗВАН
```

### Тест 6: `asset-update.service` — использует updateIntervalHours для shouldUpdate
```
GIVEN: user.lastUpdated = 3 часа назад, updateIntervalHours=4, intervalHours=2
WHEN: updateAssetsForUsers()
THEN: активы НЕ обновляются (прошло 3ч < 4ч updateIntervalHours)
```

### Тест 7: `asset-update.service` — обновляет если прошло updateIntervalHours
```
GIVEN: user.lastUpdated = 5 часов назад, updateIntervalHours=4
WHEN: updateAssetsForUsers()
THEN: активы обновляются (прошло 5ч >= 4ч)
```

## Ожидаемый результат

- `asset-update.service.ts` использует `updateIntervalHours` (а не `intervalHours`) для определения нужно ли обновлять активы
- `alerts.service.ts` использует `intervalHours` для кулдауна — остается без изменений (уже корректно)
- `thresholdPercent` логика работает корректно: `Math.abs(change) >= thresholdPercent`
- Все граничные случаи покрыты тестами

## Критерии приёмки

- [ ] Все 7 тесткейсов проходят (зеленые)
- [ ] `asset-update.service.ts` заменяет `intervalHours` → `updateIntervalHours` в расчёте `shouldUpdate`
- [ ] `alerts.service.ts` — логика кулдауна (`intervalHours`) не изменена
- [ ] `alerts.service.ts` — логика порога (`thresholdPercent`) не изменена
- [ ] Тесты покрывают: точно на пороге, ниже порога, отрицательное изменение, previousPrice=0, NFT
