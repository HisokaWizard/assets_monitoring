# Sub-task 4: E2E Tests for Assets Module

## Описание
Написать E2E (end-to-end) тесты для assets модуля, тестирующие полный цикл HTTP запросов.

## Способ решения (используем contextDocs)

Перед реализацией получить контекст:
```typescript
[context_docs: {"layer": "backend", "topic": "TESTING"}]
[context_docs: {"layer": "backend", "search": "e2e test"}]
```

### Что тестируем:

**1. GET /assets**
- Возвращает 200 и массив активов
- Работает с пустой базой
- Возвращает mixed типы (crypto + nft)

**2. GET /assets/:id**
- Возвращает 200 и актив по ID
- Возвращает 404 если не найден
- Работает с CryptoAsset
- Работает с NFTAsset

**3. POST /assets**
- Создает CryptoAsset (201)
- Создает NFTAsset (201)
- Возвращает 400 при невалидных данных
- Сохраняет в базу данных

**4. PUT /assets/:id**
- Обновляет существующий актив (200)
- Возвращает 404 если не найден
- Валидирует входные данные

**5. DELETE /assets/:id**
- Удаляет актив (200/204)
- Возвращает 404 если не найден
- Удаляет из базы данных

**6. Полный цикл CRUD**
- Создать → Получить → Обновить → Удалить

### Порядок тестов:
```typescript
// 1. Создание
const createResponse = await request(app.getHttpServer())
  .post('/assets')
  .send(cryptoAssetData)
  .expect(201);

const assetId = createResponse.body.id;

// 2. Получение
await request(app.getHttpServer())
  .get(`/assets/${assetId}`)
  .expect(200);

// 3. Обновление
await request(app.getHttpServer())
  .put(`/assets/${assetId}`)
  .send({ amount: 2.0 })
  .expect(200);

// 4. Удаление
await request(app.getHttpServer())
  .delete(`/assets/${assetId}`)
  .expect(200);
```

### Тестовые данные:
```typescript
const cryptoAssetData = {
  type: 'crypto',
  amount: 1.5,
  middlePrice: 50000,
  symbol: 'BTC',
  fullName: 'Bitcoin',
  currentPrice: 52000,
};

const nftAssetData = {
  type: 'nft',
  amount: 1,
  middlePrice: 10,
  collectionName: 'BAYC',
  floorPrice: 15,
  traitPrice: 20,
};
```

## Файл для создания
`backend/test/assets.e2e-spec.ts`

## Критерии приёмки
- [ ] E2E тесты для GET /assets:
  - [ ] Возвращает 200 и массив
  - [ ] Работает с пустой базой
  - [ ] Возвращает mixed типы

- [ ] E2E тесты для GET /assets/:id:
  - [ ] Возвращает 200 и актив
  - [ ] Возвращает 404 если не найден
  - [ ] Работает с crypto
  - [ ] Работает с nft

- [ ] E2E тесты для POST /assets:
  - [ ] Создает crypto (201)
  - [ ] Создает nft (201)
  - [ ] Сохраняет в БД
  - [ ] Возвращает 400 при ошибке

- [ ] E2E тесты для PUT /assets/:id:
  - [ ] Обновляет актив (200)
  - [ ] Возвращает 404 если не найден
  - [ ] Валидирует данные

- [ ] E2E тесты для DELETE /assets/:id:
  - [ ] Удаляет актив (200/204)
  - [ ] Возвращает 404 если не найден
  - [ ] Удаляет из БД

- [ ] Тест полного цикла CRUD
- [ ] Тестовая БД используется (не production)
- [ ] Тесты проходят: `npm run test:e2e -- assets.e2e-spec.ts`
