# sub_task_3 — Исправление refreshNFTs + расчёт middlePriceUsd при создании

## Описание
1. Исправить `refreshNFTs()` в assets.service.ts — apiKey не передавался в updateNFTAsset
2. Добавить расчёт `middlePriceUsd` при создании NFT актива (middlePrice * курс nativeToken)

## Изменения

### assets.service.ts — refreshNFTs()
```typescript
async refreshNFTs(userId: number): Promise<Asset[]> {
  const nftAssets = await this.assetsRepository.find({ where: { userId, type: 'nft' } });
  
  // Получить API ключ пользователя
  const userSettingsData = await this.userSettingsService.getUserSettings({ id: userId } as User);
  const openseaApiKey = userSettingsData?.openseaApiKey;
  
  for (const asset of nftAssets) {
    try {
      await this.assetUpdateService.updateNFTAsset(asset as NFTAsset, openseaApiKey || undefined);
    } catch (error) {
      this.logger.error(`Ошибка обновления NFT ${asset.id}: ${error.message}`);
    }
  }
  
  return this.assetsRepository.find({ where: { userId, type: 'nft' } });
}
```

### assets.service.ts — create() для NFT
Добавить расчёт middlePriceUsd:
```typescript
} else {
  // ... существующий код ...
  
  // Рассчитать middlePriceUsd через курс nativeToken
  let middlePriceUsd: number = 0;
  const nativeToken = createAssetDto.nativeToken || 'ETH';
  const tokenPrice = await this.getCryptoPrice(nativeToken);
  if (tokenPrice && createAssetDto.middlePrice) {
    middlePriceUsd = createAssetDto.middlePrice * tokenPrice;
  }
  
  (asset as NFTAsset).nativeToken = nativeToken;
  (asset as NFTAsset).middlePriceUsd = middlePriceUsd;
  // floorPriceUsd будет заполнен при первом refresh
}
```

## Тесткейсы для TDD

```typescript
describe('refreshNFTs', () => {
  it('should pass openseaApiKey to updateNFTAsset', async () => {
    const mockSettings = { openseaApiKey: 'user-opensea-key' };
    jest.spyOn(userSettingsService, 'getUserSettings').mockResolvedValue(mockSettings as any);
    const updateSpy = jest.spyOn(assetUpdateService, 'updateNFTAsset').mockResolvedValue();
    
    await service.refreshNFTs(1);
    
    expect(updateSpy).toHaveBeenCalledWith(expect.anything(), 'user-opensea-key');
  });

  it('should work without apiKey when not set', async () => {
    jest.spyOn(userSettingsService, 'getUserSettings').mockResolvedValue(null as any);
    const updateSpy = jest.spyOn(assetUpdateService, 'updateNFTAsset').mockResolvedValue();
    
    await service.refreshNFTs(1);
    
    expect(updateSpy).toHaveBeenCalledWith(expect.anything(), undefined);
  });
});

describe('create NFT', () => {
  it('should calculate middlePriceUsd when creating NFT', async () => {
    jest.spyOn(service, 'getCryptoPrice').mockResolvedValue(2000);
    const dto = { type: 'nft', collectionName: 'test', amount: 1, middlePrice: 1.5, nativeToken: 'ETH' };
    const result = await service.create(dto as any);
    expect((result as NFTAsset).middlePriceUsd).toBe(3000); // 1.5 * 2000
  });

  it('should default nativeToken to ETH if not provided', async () => {
    jest.spyOn(service, 'getCryptoPrice').mockResolvedValue(2000);
    const dto = { type: 'nft', collectionName: 'test', amount: 1, middlePrice: 1.5 };
    const result = await service.create(dto as any);
    expect((result as NFTAsset).nativeToken).toBe('ETH');
  });
});
```

## Ожидаемый результат
- refreshNFTs передаёт apiKey пользователя в updateNFTAsset
- При создании NFT рассчитывается middlePriceUsd

## Критерии приёмки
- [ ] Unit тесты refreshNFTs проходят
- [ ] Unit тесты create NFT проходят
- [ ] Ручной тест: POST /assets/refresh-nft обновляет данные NFT с актуальным floorPriceUsd
