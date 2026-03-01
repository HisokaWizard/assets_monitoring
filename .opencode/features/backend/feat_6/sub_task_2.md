# sub_task_2 — Исправление fetchFromOpenSea + updateNFTAsset

## Описание
Исправить `fetchFromOpenSea()` чтобы он возвращал и `floorPrice`, и `floorPriceUsd`.
Обновить `updateNFTAsset()` для сохранения обоих полей.

## Изменения

### asset-update.service.ts

#### fetchFromOpenSea → возвращать объект
```typescript
private async fetchFromOpenSea(
  collectionName: string,
  apiKey?: string,
): Promise<{ floorPrice: number | null; floorPriceUsd: number | null }> {
  try {
    // ...
    const stats = response.data?.stats;
    return {
      floorPrice: stats?.floor_price ?? null,
      floorPriceUsd: stats?.floor_price_usd ?? null,
    };
  } catch (error) {
    return { floorPrice: null, floorPriceUsd: null };
  }
}
```

#### updateNFTAsset → сохранять floorPriceUsd
```typescript
async updateNFTAsset(asset: NFTAsset, apiKey?: string): Promise<void> {
  const { floorPrice, floorPriceUsd } = await this.fetchFromOpenSea(asset.collectionName, apiKey);
  if (floorPrice !== null) {
    asset.floorPrice = floorPrice;
    if (floorPriceUsd !== null) {
      asset.floorPriceUsd = floorPriceUsd;
    }
    await this.calculateChanges(asset);
    await this.saveHistoricalPrice(asset.id, floorPrice, 'OpenSea');
    await this.assetsRepository.save(asset);
  }
}
```

## Тесткейсы для TDD

```typescript
describe('fetchFromOpenSea', () => {
  it('should return both floorPrice and floorPriceUsd from OpenSea response', async () => {
    const mockResponse = {
      data: {
        stats: {
          floor_price: 1.5,
          floor_price_usd: 4200.00,
        }
      }
    };
    jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));
    const result = await service['fetchFromOpenSea']('bored-ape-yacht-club', 'key');
    expect(result.floorPrice).toBe(1.5);
    expect(result.floorPriceUsd).toBe(4200.00);
  });

  it('should return null values when API fails', async () => {
    jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('API Error')));
    const result = await service['fetchFromOpenSea']('test', 'key');
    expect(result.floorPrice).toBeNull();
    expect(result.floorPriceUsd).toBeNull();
  });
});

describe('updateNFTAsset', () => {
  it('should update both floorPrice and floorPriceUsd on NFT asset', async () => {
    const asset = { collectionName: 'bayc', floorPrice: 0, floorPriceUsd: 0 } as NFTAsset;
    jest.spyOn(service as any, 'fetchFromOpenSea').mockResolvedValue({ floorPrice: 2.0, floorPriceUsd: 5600 });
    await service.updateNFTAsset(asset, 'key');
    expect(asset.floorPrice).toBe(2.0);
    expect(asset.floorPriceUsd).toBe(5600);
  });
});
```

## Ожидаемый результат
- OpenSea вызов возвращает `{ floorPrice, floorPriceUsd }`
- NFT asset сохраняет оба значения в БД

## Критерии приёмки
- [ ] Unit тесты для fetchFromOpenSea проходят
- [ ] Unit тесты для updateNFTAsset проходят
- [ ] floorPriceUsd сохраняется в БД после refreshNFTs
