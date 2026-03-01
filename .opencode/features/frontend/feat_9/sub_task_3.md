# sub_task_3 — Обновить таблицу NFTs (USD колонки + calculateFields)

## Описание
Обновить таблицу в NftsPage.tsx — добавить USD колонки и исправить calculateFields.

## Изменения

### calculateFields()
```typescript
const calculateFields = (asset: NFTAsset) => {
  // Для Value и Invested использовать USD значения
  const floorUsd = asset.floorPriceUsd || 0;
  const middleUsd = asset.middlePriceUsd || 0;
  
  const totalValue = (asset.amount || 0) * floorUsd;
  const totalInvested = (asset.amount || 0) * middleUsd;
  const profitLoss = totalValue - totalInvested;
  const profitLossPercent = middleUsd > 0
    ? ((floorUsd - middleUsd) / middleUsd) * 100
    : 0;
  
  return { totalValue, totalInvested, profitLoss, profitLossPercent };
};
```

### Заголовки таблицы — добавить USD колонки
```
Collection | Amount | Avg Price (ETH) | Avg Price USD | Floor Price (ETH) | Floor Price USD | Value | Invested | P/L | % | Multiple | ...
```

### Ячейки данных
```tsx
<TableCell align="right">
  {formatValue(asset.middlePrice)} {asset.nativeToken || 'ETH'}
</TableCell>
<TableCell align="right">
  {formatValue(asset.middlePriceUsd, 'currency')}
</TableCell>
<TableCell align="right">
  {formatValue(asset.floorPrice)} {asset.nativeToken || 'ETH'}
</TableCell>
<TableCell align="right">
  {formatValue(asset.floorPriceUsd, 'currency')}
</TableCell>
```

## Тесткейсы для TDD
```typescript
it('should display middlePriceUsd in USD column');
it('should display floorPriceUsd in USD column');
it('should calculate Value using floorPriceUsd not floorPrice');
it('should calculate Invested using middlePriceUsd not middlePrice');
it('should show native token symbol next to native price');
```

## Критерии приёмки
- [ ] Таблица имеет колонки "Avg Price USD" и "Floor Price USD"
- [ ] Value рассчитывается через floorPriceUsd
- [ ] Invested рассчитывается через middlePriceUsd
- [ ] Нативные цены отображаются с символом токена
