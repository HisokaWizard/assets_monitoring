# sub_task_5 — Интеграционные тесты NFT логики

## Описание
Написать/обновить существующие spec файлы для покрытия всей исправленной логики NFT.

## Файлы
- `backend/src/assets/asset-update.service.spec.ts`
- `backend/src/assets/assets.service.spec.ts`

## Тесткейсы

### asset-update.service.spec.ts
```typescript
describe('AssetUpdateService - NFT', () => {
  describe('fetchFromOpenSea', () => {
    it('extracts floor_price and floor_price_usd from response');
    it('returns null values on HTTP error');
    it('returns null values when stats is missing');
  });

  describe('updateNFTAsset', () => {
    it('saves floorPrice and floorPriceUsd to asset');
    it('calls calculateChanges after updating prices');
    it('calls saveHistoricalPrice with floor price');
    it('does not update if floorPrice is null');
  });

  describe('calculateChanges - NFT', () => {
    it('uses floorPrice (not currentPrice) for NFT change calculations');
    it('calculates totalChange based on floorPrice vs middlePrice');
  });
});
```

### assets.service.spec.ts
```typescript
describe('AssetsService - NFT', () => {
  describe('create NFT', () => {
    it('sets type to nft');
    it('sets nativeToken from dto (defaults to ETH)');
    it('calculates middlePriceUsd = middlePrice * tokenPrice');
    it('sets floorPrice from dto or fetches from OpenSea');
  });

  describe('refreshNFTs', () => {
    it('fetches user settings for apiKey');
    it('calls updateNFTAsset with openseaApiKey');
    it('returns updated NFT assets list');
  });
});
```

## Ожидаемый результат
- Все unit тесты проходят (green)
- Покрытие NFT логики > 80%

## Критерии приёмки
- [ ] npm test проходит без ошибок
- [ ] Нет regress для crypto логики
- [ ] Все новые тесты зелёные
