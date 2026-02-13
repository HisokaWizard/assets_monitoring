# Feature 2: Write Tests for Assets Module

## Описание задачи
Написать unit и e2e тесты для модуля управления активами (assets). Модуль содержит работу с криптовалютами и NFT.

## Контекст (из contextDocs)

Перед написанием тестов получить контекст:
```typescript
[context_docs: {"layer": "backend", "topic": "TESTING"}]
[context_docs: {"layer": "backend", "topic": "NEST_JS_ARCHITECTURE"}]
[context_docs: {"layer": "backend", "search": "typeorm inheritance"}]
```

**Существующий код:**
- `assets.service.ts` — CRUD операции (findAll, findOne, create, update, remove)
- `assets.controller.ts` — REST endpoints
- `asset-update.service.ts` — обновление цен активов
- Entities: `Asset` (base), `CryptoAsset`, `NFTAsset`, `HistoricalPrice`
- DTOs: `create-asset.dto.ts`, `update-asset.dto.ts`

**Особенности:**
- Table Per Class inheritance (CryptoAsset и NFTAsset наследуют Asset)
- Работа с внешними API (CoinMarketCap, OpenSea)
- Поддержка двух типов активов: crypto и nft

## Декомпозиция

1. **Тесты для AssetsService** — unit тесты для CRUD операций с обоими типами активов
2. **Тесты для AssetsController** — unit тесты для REST endpoints
3. **Тесты для AssetUpdateService** — unit тесты для обновления цен
4. **E2E тесты для Assets** — интеграционные тесты всего модуля

## Оценка сложности
Средняя-Высокая (3-4 часа)

## Зависимости
- Assets модуль реализован
- TypeORM настроен с наследованием
- Jest настроен
- @nestjs/testing установлен

## Создано
2026-02-13

## Ожидаемый результат
- Покрытие assets.service.ts unit тестами (CRUD + наследование)
- Покрытие assets.controller.ts unit тестами
- Покрытие asset-update.service.ts unit тестами
- E2E тесты для endpoints /assets
- Все тесты проходят (npm test)
