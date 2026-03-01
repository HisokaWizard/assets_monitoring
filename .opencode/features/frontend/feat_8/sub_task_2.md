# Sub-task 2: Backend - добавить endpoint для refresh NFT

## Описание

Добавить отдельный endpoint для обновления только NFT активов пользователя.

## Решение

1. Добавить новый endpoint в AssetsController: `@Post('refresh-nft')`
2. Реализовать метод в AssetsService: `async refreshNFTs(userId: number): Promise<Asset[]>`
3. Метод должен:
   - Найти все NFT активы пользователя
   - Обновить каждую через AssetUpdateService
   - Вернуть обновленные активы

## Ожидаемый результат

- Endpoint POST /assets/refresh-nft обновляет только NFT активы
- Возвращается массив обновленных NFT

## Критерии приёмки

- [ ] Endpoint работает и обновляет только NFT
- [ ] Возвращаются обновленные данные
- [ ] Тесты проходят
