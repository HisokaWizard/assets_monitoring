# Sub-task 3: Unit Tests for AssetUpdateService

## Описание
Написать unit тесты для AssetUpdateService, покрывающие обновление цен активов из внешних API.

## Способ решения (используем contextDocs)

Перед реализацией получить контекст:
```typescript
[context_docs: {"layer": "backend", "search": "http service test"}]
[context_docs: {"layer": "backend", "search": "scheduler"}]
```

### Что тестируем:

**1. updateAssetsForUsers()**
- Получает настройки уведомлений с пользователями
- Фильтрует по enabled: true
- Группирует настройки по пользователям
- Проверяет интервал обновления
- Обновляет активы, если прошло достаточно времени
- Обновляет lastUpdated пользователя
- Возвращает массив ID обновленных активов

**2. updateCryptoAsset(asset)**
- Вызывает CoinMarketCap API
- Обновляет currentPrice
- Сохраняет историческую цену
- Обрабатывает ошибки API

**3. updateNFTAsset(asset)**
- Вызывает OpenSea API
- Обновляет floorPrice
- Сохраняет историческую цену
- Обрабатывает ошибки API

**4. Обработка ошибок**
- Логирует ошибки при обновлении
- Продолжает обновление других активов при ошибке
- Не падает при недоступности API

### Моки:
```typescript
const mockHttpService = {
  get: jest.fn(),
};

const mockAssetsRepository = {
  find: jest.fn(),
  save: jest.fn(),
};

const mockHistoricalPriceRepository = {
  save: jest.fn(),
};

const mockUserRepository = {
  save: jest.fn(),
};

const mockNotificationSettingsRepository = {
  find: jest.fn(),
};
```

### Тестовые данные:
```typescript
const mockCryptoAsset = {
  id: 1,
  type: 'crypto',
  symbol: 'BTC',
  userId: 1,
};

const mockNFTAsset = {
  id: 2,
  type: 'nft',
  collectionName: 'BAYC',
  userId: 1,
};

const mockNotificationSettings = {
  userId: 1,
  enabled: true,
  intervalHours: 4,
  user: { id: 1, lastUpdated: new Date('2024-01-01') },
};
```

## Файл для создания
`backend/src/assets/asset-update.service.spec.ts`

## Критерии приёмки
- [ ] Тесты для updateAssetsForUsers():
  - [ ] Получает настройки с relations
  - [ ] Фильтрует по enabled
  - [ ] Группирует по userId
  - [ ] Проверяет интервал обновления
  - [ ] Обновляет активы при shouldUpdate=true
  - [ ] Пропускает при shouldUpdate=false
  - [ ] Обновляет user.lastUpdated
  - [ ] Возвращает массив ID

- [ ] Тесты для updateCryptoAsset():
  - [ ] Вызывает API с правильным URL
  - [ ] Обновляет currentPrice
  - [ ] Сохраняет историческую цену
  - [ ] Обрабатывает ошибку API

- [ ] Тесты для updateNFTAsset():
  - [ ] Вызывает OpenSea API
  - [ ] Обновляет floorPrice
  - [ ] Сохраняет историческую цену
  - [ ] Обрабатывает ошибку API

- [ ] Тесты обработки ошибок:
  - [ ] Логирует ошибку
  - [ ] Не падает на ошибке
  - [ ] Продолжает с другими активами

- [ ] Все моки настроены корректно
- [ ] Тесты проходят: `npm test -- asset-update.service.spec.ts`
