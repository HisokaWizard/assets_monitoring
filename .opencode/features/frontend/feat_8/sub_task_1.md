# Sub-task 1: Backend - добавить метод получения цены NFT

## Описание

Добавить в AssetsService метод для получения цены NFT из OpenSea API и модифицировать метод create для автоматического получения цены при создании NFT.

## Решение

1. Добавить метод `getNFTPrice(collectionName: string, userId?: number): Promise<number | null>` в AssetsService
2. Использовать существующую логику из AssetUpdateService.fetchFromOpenSea или вызвать её
3. В методе create для типа 'nft':
   - Если floorPrice не передан - вызвать getNFTPrice
   - После получения цены рассчитать: multiple, totalChange и др.
4. Сохранить все расчетные поля в БД

## Ожидаемый результат

- При создании NFT без цены - автоматически загружается цена из OpenSea
- Рассчитываются поля: multiple, totalChange
- Созданный NFT возвращается с заполненными полями

## Критерии приёмки

- [ ] Метод getNFTPrice корректно получает цену из OpenSea
- [ ] При создании NFT без цены - цена загружается автоматически
- [ ] Рассчитываются поля multiple и totalChange
- [ ] Тесты проходят
