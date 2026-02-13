# Sub-task 2: Unit Tests for AssetsController

## Описание
Написать unit тесты для AssetsController, покрывающие REST endpoints.

## Способ решения (используем contextDocs)

Перед реализацией получить контекст:
```typescript
[context_docs: {"layer": "backend", "search": "controller test"}]
```

### Что тестируем:

**1. GET /assets (findAll)**
- Возвращает 200 и массив активов
- Вызывает assetsService.findAll()
- Работает с пустым массивом

**2. GET /assets/:id (findOne)**
- Возвращает 200 и актив по ID
- Возвращает 404 если не найден
- Параметр id конвертируется в number
- Работает с обоими типами активов

**3. POST /assets (create)**
- Возвращает 201 и созданный актив
- Вызывает assetsService.create() с правильными данными
- Принимает CreateAssetDto
- Работает с crypto и nft типами

**4. PUT /assets/:id (update)**
- Возвращает 200 и обновленный актив
- Вызывает assetsService.update() с id и dto
- id конвертируется в number
- Возвращает 404 если актив не найден

**5. DELETE /assets/:id (remove)**
- Возвращает 200 или 204
- Вызывает assetsService.remove() с id
- id конвертируется в number

### Моки:
```typescript
const mockAssetsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
```

### Тестовые данные:
```typescript
const mockCryptoAsset = {
  id: 1,
  type: 'crypto',
  symbol: 'BTC',
  amount: 1.5,
  middlePrice: 50000,
};

const mockNFTAsset = {
  id: 2,
  type: 'nft',
  collectionName: 'BAYC',
  amount: 1,
  middlePrice: 15,
};
```

## Файл для создания
`backend/src/assets/assets.controller.spec.ts`

## Критерии приёмки
- [ ] Тесты для GET /assets:
  - [ ] Возвращает 200 и массив
  - [ ] Вызывает service.findAll()
  - [ ] Работает с пустым результатом

- [ ] Тесты для GET /assets/:id:
  - [ ] Возвращает 200 и актив
  - [ ] Возвращает 404 если не найден
  - [ ] Конвертирует id в number
  - [ ] Работает с обоими типами

- [ ] Тесты для POST /assets:
  - [ ] Возвращает 201 и созданный актив
  - [ ] Вызывает service.create() с dto
  - [ ] Работает с crypto
  - [ ] Работает с nft

- [ ] Тесты для PUT /assets/:id:
  - [ ] Возвращает 200 и обновленный актив
  - [ ] Вызывает service.update()
  - [ ] Конвертирует id в number
  - [ ] Возвращает 404 если не найден

- [ ] Тесты для DELETE /assets/:id:
  - [ ] Возвращает 200/204
  - [ ] Вызывает service.remove()
  - [ ] Конвертирует id в number

- [ ] Все моки настроены корректно
- [ ] Тесты проходят: `npm test -- assets.controller.spec.ts`
