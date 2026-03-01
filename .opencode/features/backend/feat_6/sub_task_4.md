# sub_task_4 — Обновление DTO + CreateAssetDto.nativeToken

## Описание
Добавить поле `nativeToken` в CreateAssetDto и UpdateAssetDto. Обновить DTO для валидации.

## Изменения

### create-asset.dto.ts
```typescript
/**
 * Символ нативного токена коллекции (для nft).
 * Например: 'ETH', 'SOL', 'WETH', 'ATOM'
 */
@IsOptional()
@IsString()
nativeToken?: string;
```

### Логика валидации
- `nativeToken` — опциональное поле, по умолчанию 'ETH' (устанавливается в сервисе)

## Тесткейсы для TDD

```typescript
describe('CreateAssetDto validation', () => {
  it('should accept nativeToken as optional string', async () => {
    const dto = plainToClass(CreateAssetDto, {
      type: 'nft',
      collectionName: 'test',
      amount: 1,
      middlePrice: 1.5,
      nativeToken: 'ETH',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should work without nativeToken (optional field)', async () => {
    const dto = plainToClass(CreateAssetDto, {
      type: 'nft',
      collectionName: 'test',
      amount: 1,
      middlePrice: 1.5,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject non-string nativeToken', async () => {
    const dto = plainToClass(CreateAssetDto, {
      type: 'nft',
      collectionName: 'test',
      amount: 1,
      middlePrice: 1.5,
      nativeToken: 123,
    });
    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'nativeToken')).toBe(true);
  });
});
```

## Ожидаемый результат
- CreateAssetDto принимает опциональный `nativeToken`
- Валидация работает корректно

## Критерии приёмки
- [ ] DTO компилируется без ошибок
- [ ] Тесты валидации проходят
- [ ] POST /assets с nativeToken='SOL' создаёт актив с корректным токеном
