# sub_task_4 — E2E тесты для NFT страницы

## Описание
Написать E2E тесты с Playwright для обновлённой NFT функциональности.

## Файл
`frontend/tests/nfts-page.spec.ts`

## Тесткейсы

```typescript
describe('NftsPage', () => {
  describe('Add NFT form', () => {
    it('should show Native Token field when opening Add dialog');
    it('should have ETH as default value for Native Token');
    it('should submit form with nativeToken to API');
    it('should not show Native Token field in Edit dialog');
  });

  describe('NFT Table', () => {
    it('should display Floor Price USD column');
    it('should display Avg Price USD column');
    it('should show native token symbol next to native prices');
    it('should refresh NFTs when clicking Update Quotes');
  });
});
```

## Критерии приёмки
- [ ] E2E тесты проходят
- [ ] Playwright не находит ошибок в консоли
