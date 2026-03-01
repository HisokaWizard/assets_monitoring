# Sub-task 3: Frontend - обновить assetsApi

## Описание

Добавить в frontend/assetsApi метод для обновления NFT и экспортировать типы NFTAsset.

## Решение

1. Добавить метод `refreshNFTs` в assetsApi:
   ```typescript
   refreshNFTs: builder.mutation<NFTAsset[], void>({
     query: () => ({
       url: '/assets/refresh-nft',
       method: 'POST',
     }),
     invalidatesTags: ['Assets'],
   }),
   ```
2. Убедиться что NFTAsset экспортируется из index.ts

## Ожидаемый результат

- Доступен хук useRefreshNFTsMutation
- Типы NFTAsset экспортируются

## Критерии приёмки

- [ ] useRefreshNFTsMutation доступен
- [ ] Типы NFTAsset экспортируются
- [ ] Компиляция проходит без ошибок
