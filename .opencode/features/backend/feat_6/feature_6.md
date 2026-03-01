# feat_6 — Исправление логики NFT активов (Backend)

## Описание задачи

Исправить структуру и бизнес-логику NFT активов в backend:
- Добавить поле `nativeToken` (символ токена коллекции: ETH, SOL, WETH, ATOM и т.д.)
- Добавить поле `floorPriceUsd` (floor price в долларах из OpenSea `floor_price_usd`)
- Добавить поле `middlePriceUsd` (средняя цена покупки в USD = middlePrice * курс токена)
- Исправить баг: тип `'Asset'` в БД вместо `'nft'`
- Исправить логику `refreshNFTs()` — apiKey не передавался
- Исправить `fetchFromOpenSea()` — не извлекал `floor_price_usd`
- Исправить `calculateChanges()` для NFT — добавить расчёт USD-полей
- Создать миграцию для добавления новых колонок

## Контекст

### Стек
- NestJS + TypeORM + SQLite
- Стратегия наследования: `@TableInheritance({ column: { type: 'varchar', name: 'type' } })`
- `@ChildEntity('nft')` → type='nft' в БД
- Баг: у актива id=13 type='Asset' (TypeORM записал имя класса вместо дискриминатора)

### Бизнес-логика NFT
- `middlePrice` — средняя цена покупки в нативном токене (ETH, SOL и т.д.)
- `middlePriceUsd` — средняя цена в USD (middlePrice * курс токена из CoinMarketCap)
- `floorPrice` — floor price в нативном токене (из OpenSea)
- `floorPriceUsd` — floor price в USD (из поля `floor_price_usd` ответа OpenSea)
- `nativeToken` — символ токена коллекции (пользователь вводит при создании, напр. 'ETH')
- Все расчёты изменений (daily/weekly/monthly...) ведутся в нативном токене (floorPrice)
- `multiple` = floorPrice / middlePrice (в нативном токене)
- `totalChange` = ((floorPrice - middlePrice) / middlePrice) * 100 (в нативном токене)

### OpenSea API
- URL: `https://api.opensea.io/api/v2/collections/{slug}/stats`
- Ответ: `stats.floor_price` (нативный токен), `stats.floor_price_usd` (USD)

### CoinMarketCap API
- Используется для получения курса нативного токена при расчёте middlePriceUsd

## Декомпозиция

1. **sub_task_1**: Добавить поля в Entity + создать миграцию + исправить баг с type='Asset' в БД
2. **sub_task_2**: Исправить `fetchFromOpenSea()` для извлечения `floor_price_usd` + обновить `updateNFTAsset()`
3. **sub_task_3**: Исправить `refreshNFTs()` — передача apiKey + расчёт `middlePriceUsd` при создании
4. **sub_task_4**: Обновить DTO (CreateAssetDto, UpdateAssetDto) + валидацию `nativeToken`
5. **sub_task_5**: Написать unit тесты для исправленной логики

## Оценка сложности
Medium — затрагивает entity, migration, service, dto, тесты

## Зависимости
- TypeORM migrations
- OpenSea API v2
- CoinMarketCap API
