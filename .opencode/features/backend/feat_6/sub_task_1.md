# sub_task_1 — Entity + Migration + Fix type='Asset' в БД

## Описание
Добавить новые поля в `NFTAsset` entity и создать TypeORM миграцию. Исправить запись с type='Asset' в БД.

## Изменения

### asset.entity.ts — NFTAsset
Добавить поля:
```typescript
@ChildEntity('nft')
export class NFTAsset extends Asset {
  @Column({ nullable: true })
  collectionName: string;

  @Column({ nullable: true })
  nativeToken: string;           // NEW: символ токена (ETH, SOL, WETH, ATOM)

  @Column({ type: 'decimal', nullable: true })
  floorPrice: number;            // В нативном токене

  @Column({ type: 'decimal', nullable: true })
  floorPriceUsd: number;         // NEW: floor price в USD (из OpenSea floor_price_usd)

  @Column({ type: 'decimal', nullable: true })
  middlePriceUsd: number;        // NEW: средняя цена в USD (middlePrice * курс токена)

  @Column({ type: 'decimal', nullable: true })
  traitPrice: number;
}
```

### Миграция
Создать SQL миграцию для добавления колонок:
- `nativeToken` VARCHAR nullable
- `floorPriceUsd` DECIMAL nullable  
- `middlePriceUsd` DECIMAL nullable

### Исправление данных в БД
UPDATE asset SET type='nft' WHERE type='Asset' AND collectionName IS NOT NULL;

## Тесткейсы для TDD

```typescript
// entity.spec.ts
describe('NFTAsset entity', () => {
  it('should have nativeToken field', () => {
    const nft = new NFTAsset();
    nft.nativeToken = 'ETH';
    expect(nft.nativeToken).toBe('ETH');
  });

  it('should have floorPriceUsd field', () => {
    const nft = new NFTAsset();
    nft.floorPriceUsd = 1500.50;
    expect(nft.floorPriceUsd).toBe(1500.50);
  });

  it('should have middlePriceUsd field', () => {
    const nft = new NFTAsset();
    nft.middlePriceUsd = 12000;
    expect(nft.middlePriceUsd).toBe(12000);
  });
});
```

## Ожидаемый результат
- NFTAsset entity имеет поля: nativeToken, floorPriceUsd, middlePriceUsd
- Миграция добавляет колонки в таблицу asset
- Запись type='Asset' исправлена на type='nft'

## Критерии приёмки
- [ ] Entity компилируется без ошибок
- [ ] Миграция выполняется без ошибок
- [ ] sqlite: SELECT * FROM asset WHERE type='Asset' → пустой результат
- [ ] Новые колонки присутствуют в PRAGMA table_info(asset)
