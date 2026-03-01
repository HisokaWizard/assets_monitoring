# feat_9 — Исправление UI NFT активов (Frontend)

## Описание задачи

Обновить frontend для поддержки новых полей NFT:
- Добавить поле `nativeToken` в форму создания NFT
- Добавить колонки `Floor Price USD` и `Avg Price USD` в таблицу
- Обновить типы TypeScript (`NFTAsset`, `CreateNFTAssetDto`)
- Отображать `middlePriceUsd` и `floorPriceUsd` как стоимость в USD
- Исправить формулы `calculateFields()` для использования USD-значений

## Контекст

### Текущая проблема
- Таблица отображает `middlePrice` и `floorPrice` в USD формате, но они в ETH
- `floorPriceUsd` — новое поле, которое приходит с backend после sub_task_2
- `middlePriceUsd` — новое поле, приходит с backend
- `nativeToken` — новое поле для формы создания NFT

### Бизнес-логика отображения
- "Avg Price" (нативный) — показывает middlePrice (в ETH/SOL/etc)
- "Avg Price USD" — показывает middlePriceUsd (в USD)
- "Floor Price" (нативный) — показывает floorPrice (в ETH/SOL/etc)
- "Floor Price USD" — показывает floorPriceUsd (в USD)
- "Value" = amount * floorPriceUsd
- "Invested" = amount * middlePriceUsd
- "P/L" = Value - Invested (в USD)

## Декомпозиция

1. **sub_task_1**: Обновить TypeScript типы (NFTAsset, CreateNFTAssetDto, UpdateAssetDto)
2. **sub_task_2**: Добавить поле `nativeToken` в форму добавления NFT
3. **sub_task_3**: Обновить таблицу NFTs — добавить USD колонки и исправить calculateFields
4. **sub_task_4**: E2E тесты для NFT формы и таблицы

## Оценка сложности
Low-Medium

## Зависимости
- feat_6 backend должен быть выполнен (нужны новые поля в API ответе)
