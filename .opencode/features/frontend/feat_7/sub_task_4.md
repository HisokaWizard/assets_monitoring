# Sub-task 4: Создать entity assets на frontend

## Описание

Создать RTK Query API для работы с активами на frontend. Необходимо создать:
- Типы для CryptoAsset и связанных DTO
- RTK Query endpoints для CRUD операций и обновления

## Способ решения

Следовать паттерну существующего entity user-settings:
1. Создать папку frontend/src/entities/assets/
2. Создать types.ts с типами
3. Создать assetsApi.ts с RTK Query endpoints

## Подготовка тесткейсов для TDD

1. **Тест: Получение списка токенов**
   - Хук: useGetAssetsQuery
   - Ожидание: возвращает массив CryptoAsset

2. **Тест: Создание токена**
   - Хук: useCreateAssetMutation
   - Вход: { type: 'crypto', symbol: 'BTC', amount: 1, middlePrice: 50000 }
   - Ожидание: создаёт актив, инвалидирует кэш

3. **Тест: Обновление всех токенов**
   - Хук: useRefreshAssetsMutation
   - Ожидание: возвращает обновлённые активы

## Ожидаемый результат

Созданы:
- frontend/src/entities/assets/model/types.ts
- frontend/src/entities/assets/model/assetsApi.ts
- frontend/src/entities/assets/index.ts

## Критерии приёмки

- [ ] Все CRUD операции работают через RTK Query
- [ ] Типы соответствуют backend моделям
- [ ] Unit тесты покрывают API
