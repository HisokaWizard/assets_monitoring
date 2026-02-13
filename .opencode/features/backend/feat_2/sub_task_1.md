# Sub-task 1: Unit Tests for AssetsService

## Описание
Написать unit тесты для AssetsService, покрывающие CRUD операции с учетом наследования (CryptoAsset и NFTAsset).

## Способ решения (используем contextDocs)

Перед реализацией получить контекст:
```typescript
[context_docs: {"layer": "backend", "topic": "TESTING"}]
[context_docs: {"layer": "backend", "topic": "ENTITY"}]
```

### Что тестируем:

**1. findAll()**
- Возвращает массив всех активов
- Работает с пустой таблицей
- Возвращает активы обоих типов (crypto и nft)

**2. findOne(id)**
- Возвращает актив по ID
- Возвращает null если не найден
- Работает с CryptoAsset
- Работает с NFTAsset

**3. create(createAssetDto)**
- **CryptoAsset:**
  - Создает с типом 'crypto'
  - Устанавливает symbol, fullName, currentPrice
  - Инициализирует change поля (daily, weekly, monthly, quart, year, total) в 0
  - Инициализирует previousPrice и multiple в 0

- **NFTAsset:**
  - Создает с типом 'nft'
  - Устанавливает collectionName, floorPrice, traitPrice
  - Инициализирует change поля в 0

**4. update(id, updateAssetDto)**
- Обновляет существующий актив
- Возвращает обновленный актив
- Возвращает null если актив не найден

**5. remove(id)**
- Удаляет актив по ID
- Не выбрасывает ошибку если не найден

### Моки:
```typescript
const mockAssetsRepository = {
  find: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

### Тестовые данные:
```typescript
// CryptoAsset
{
  type: 'crypto',
  amount: 1.5,
  middlePrice: 50000,
  symbol: 'BTC',
  fullName: 'Bitcoin',
  currentPrice: 52000
}

// NFTAsset
{
  type: 'nft',
  amount: 1,
  middlePrice: 10,
  collectionName: 'Bored Ape Yacht Club',
  floorPrice: 15,
  traitPrice: 20
}
```

## Файл для создания
`backend/src/assets/assets.service.spec.ts`

## Критерии приёмки
- [ ] Тесты для findAll():
  - [ ] Возвращает массив активов
  - [ ] Работает с пустой таблицей
  - [ ] Возвращает mixed типы (crypto + nft)

- [ ] Тесты для findOne():
  - [ ] Находит существующий актив
  - [ ] Возвращает null если не найден
  - [ ] Работает с обоими типами

- [ ] Тесты для create():
  - [ ] Создает CryptoAsset со всеми полями
  - [ ] Создает NFTAsset со всеми полями
  - [ ] Инициализирует change поля в 0
  - [ ] Сохраняет в репозиторий

- [ ] Тесты для update():
  - [ ] Обновляет актив
  - [ ] Возвращает обновленный объект
  - [ ] Возвращает null для несуществующего

- [ ] Тесты для remove():
  - [ ] Удаляет актив
  - [ ] Не падает на несуществующем

- [ ] Все моки настроены корректно
- [ ] Тесты проходят: `npm test -- assets.service.spec.ts`
