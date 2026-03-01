# sub_task_1 — Обновить TypeScript типы

## Описание
Обновить типы в `frontend/src/entities/assets/model/types.ts` для поддержки новых полей.

## Изменения

### types.ts — NFTAsset
```typescript
export interface NFTAsset extends Asset {
  type: 'nft';
  collectionName: string;
  nativeToken: string;        // NEW: символ токена (ETH, SOL, etc)
  floorPrice: number;         // В нативном токене
  floorPriceUsd: number;      // NEW: floor price в USD
  middlePriceUsd: number;     // NEW: средняя цена в USD
  traitPrice: number;
  // ... price history fields
}
```

### types.ts — CreateNFTAssetDto
```typescript
export interface CreateNFTAssetDto {
  type: 'nft';
  collectionName: string;
  nativeToken?: string;       // NEW: опциональный (по умолчанию ETH)
  amount: number;
  middlePrice: number;
  floorPrice?: number;
  traitPrice?: number;
}
```

## Тесткейсы для TDD
```typescript
// Проверка типов через TypeScript compiler
// Достаточно что TypeScript компилируется без ошибок
it('NFTAsset should have nativeToken field', () => {
  const nft: NFTAsset = {
    // ... другие поля
    nativeToken: 'ETH',
    floorPriceUsd: 4200,
    middlePriceUsd: 3000,
  } as NFTAsset;
  expect(nft.nativeToken).toBe('ETH');
});
```

## Критерии приёмки
- [ ] TypeScript компилируется без ошибок (npm run build)
- [ ] NFTAsset содержит nativeToken, floorPriceUsd, middlePriceUsd
- [ ] CreateNFTAssetDto содержит опциональный nativeToken
