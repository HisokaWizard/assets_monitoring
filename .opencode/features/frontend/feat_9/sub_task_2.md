# sub_task_2 — Добавить nativeToken в форму NFT

## Описание
Добавить поле "Native Token" в форму создания NFT в NftsPage.tsx.

## Изменения в NftsPage.tsx

### formData state
```typescript
const [formData, setFormData] = useState({
  collectionName: '',
  nativeToken: 'ETH',   // NEW: по умолчанию ETH
  amount: '',
  middlePrice: '',
});
```

### handleOpenDialog
```typescript
if (nft) {
  setFormData({
    collectionName: nft.collectionName || '',
    nativeToken: nft.nativeToken || 'ETH',  // NEW
    amount: nft.amount?.toString() || '',
    middlePrice: nft.middlePrice?.toString() || '',
  });
} else {
  setFormData({ collectionName: '', nativeToken: 'ETH', amount: '', middlePrice: '' });
}
```

### handleCloseDialog
```typescript
setFormData({ collectionName: '', nativeToken: 'ETH', amount: '', middlePrice: '' });
```

### createAsset call
```typescript
await createAsset({
  type: 'nft',
  collectionName: formData.collectionName,
  nativeToken: formData.nativeToken,   // NEW
  amount: parseFloat(formData.amount),
  middlePrice: parseFloat(formData.middlePrice),
});
```

### TextField в форме (после Collection Name)
```tsx
{!editingId && (
  <TextField
    label="Native Token"
    value={formData.nativeToken}
    onChange={(e) => setFormData({ ...formData, nativeToken: e.target.value.toUpperCase() })}
    placeholder="e.g., ETH"
    fullWidth
    helperText="Token symbol the collection trades in (ETH, SOL, WETH, ATOM)"
  />
)}
```

## Тесткейсы для TDD
```typescript
it('should show Native Token field when adding new NFT');
it('should not show Native Token field when editing NFT');
it('should default Native Token to ETH');
it('should convert input to uppercase');
it('should include nativeToken in createAsset call');
```

## Критерии приёмки
- [ ] Поле "Native Token" отображается в форме добавления
- [ ] Поле скрыто при редактировании
- [ ] По умолчанию ETH
- [ ] Ввод приводится к верхнему регистру
- [ ] Значение передаётся в API при создании
