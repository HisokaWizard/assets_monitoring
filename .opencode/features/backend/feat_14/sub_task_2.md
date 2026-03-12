# Sub-task 2: Репозитории модуля assets (AssetRepository, HistoricalPriceRepository)

## Описание

Создать кастомные `AssetRepository` и `HistoricalPriceRepository` для сущностей `Asset` и `HistoricalPrice`. Перенести все операции с БД из `AssetsService` и `AssetUpdateService` в репозитории. Обновить `AssetsModule` и тесты.

## Способ решения

### 1. Создать `AssetRepository`

Файл: `backend/src/assets/asset.repository.ts`

Методы для переноса из AssetsService:
- `findAll(): Promise<Asset[]>` — из `findAll()` (строка 53)
- `findOneById(id: number): Promise<Asset | null>` — из `findOne()` (строка 63)
- `saveAsset(asset: Asset): Promise<Asset>` — из `create()` (строка 181)
- `updateById(id: number, data: Partial<Asset>): Promise<void>` — из `update()` (строка 195)
- `deleteById(id: number): Promise<void>` — из `remove()` (строка 206)
- `findByUserId(userId: number): Promise<Asset[]>` — из `refreshAll()` (строка 242) и AssetUpdateService (строка 105, 154)
- `findByUserIdAndType(userId: number, type: string): Promise<Asset[]>` — из `refreshNFTs()` (строка 246)
- `saveMany(assets: Asset[]): Promise<Asset[]>` — из ReportsService (строка 221)

Методы для переноса из AssetUpdateService:
- `findByUserId(userId: number)` — уже выше
- `saveAsset(asset: Asset)` — уже выше

Методы для переноса из AlertsService (cross-module, read-only):
- `findByUserIdWithQueryBuilder(userId: number, assetIds?: number[]): Promise<Asset[]>` — из `checkUserAlertsAfterUpdate()` (строки 120-130)

Методы для переноса из ReportsService (cross-module, read-only):
- `findDistinctUserIds(): Promise<number[]>` — из `generatePeriodicReports()` (строки 117-120)
- `findByUserIdWithRelations(userId: number, relations: string[]): Promise<Asset[]>` — из `generateUserPeriodicReport()` (строки 173-176)

### 2. Создать `HistoricalPriceRepository`

Файл: `backend/src/assets/historical-price.repository.ts`

Методы для переноса из AssetUpdateService:
- `savePrice(data: { assetId: number; price: number; timestamp: Date; source: string }): Promise<HistoricalPrice>` — из `saveHistoricalPrice()` (строки 453-459)
- `findByAssetIdDesc(assetId: number, take: number): Promise<HistoricalPrice[]>` — из `calculateChanges()` (строки 375-379)

Методы для переноса из NotificationsService:
- `findByAssetIdWithLimit(assetId: number, limit: number): Promise<HistoricalPrice[]>` — из `getAssetHistory()` (строки 153-158)

Методы для переноса из ReportsService (cross-module):
- `countOlderThan(userId: number, threshold: Date): Promise<number>` — из `hasEnoughHistory()` (строки 307-314)

### 3. Рефакторинг `AssetsService`

- Заменить `@InjectRepository(Asset) private assetsRepository: Repository<Asset>` на `private readonly assetRepository: AssetRepository`
- Заменить все прямые вызовы на методы AssetRepository

### 4. Рефакторинг `AssetUpdateService`

- Заменить `@InjectRepository(Asset)` на `AssetRepository`
- Заменить `@InjectRepository(HistoricalPrice)` на `HistoricalPriceRepository`
- Заменить `@InjectRepository(User)` на `UserRepository` (из auth модуля, sub_task_1)
- Заменить `@InjectRepository(NotificationSettings)` на `NotificationSettingsRepository` (из notifications модуля, sub_task_3)
- **ВАЖНО:** Для User и NotificationSettings — на данном этапе оставить `@InjectRepository()` как есть. Замена произойдет в sub_task_5 (интеграция), когда все репозитории будут готовы.

### 5. Обновить `AssetsModule`

- Добавить `AssetRepository`, `HistoricalPriceRepository` в `providers`
- Добавить `AssetRepository`, `HistoricalPriceRepository` в `exports` (нужны в notifications модуле)

## Файлы для изменения/создания

- `backend/src/assets/asset.repository.ts` — **СОЗДАТЬ** кастомный репозиторий
- `backend/src/assets/asset.repository.spec.ts` — **СОЗДАТЬ** unit-тесты
- `backend/src/assets/historical-price.repository.ts` — **СОЗДАТЬ** кастомный репозиторий
- `backend/src/assets/historical-price.repository.spec.ts` — **СОЗДАТЬ** unit-тесты
- `backend/src/assets/assets.service.ts` — **ИЗМЕНИТЬ** инжекцию и вызовы
- `backend/src/assets/assets.service.spec.ts` — **ИЗМЕНИТЬ** моки
- `backend/src/assets/asset-update.service.ts` — **ИЗМЕНИТЬ** инжекцию Asset и HistoricalPrice (User и NotificationSettings — в sub_task_5)
- `backend/src/assets/asset-update.service.spec.ts` — **ИЗМЕНИТЬ** моки
- `backend/src/assets/assets.module.ts` — **ИЗМЕНИТЬ** providers/exports

## Тесткейсы для TDD

### Unit-тесты: AssetRepository (`asset.repository.spec.ts`)

```
describe('AssetRepository', () => {
  describe('findAll', () => {
    it('should return all assets')
    it('should return empty array when no assets')
  })

  describe('findOneById', () => {
    it('should return asset when found')
    it('should return null when not found')
  })

  describe('saveAsset', () => {
    it('should save and return the asset')
  })

  describe('updateById', () => {
    it('should call update with correct id and data')
  })

  describe('deleteById', () => {
    it('should call delete with correct id')
  })

  describe('findByUserId', () => {
    it('should return assets for given userId')
    it('should return empty array when user has no assets')
  })

  describe('findByUserIdAndType', () => {
    it('should return assets filtered by userId and type')
    it('should return empty array when no matching assets')
  })

  describe('findByUserIdWithQueryBuilder', () => {
    it('should return all user assets when no assetIds filter')
    it('should return filtered assets when assetIds provided')
  })

  describe('findDistinctUserIds', () => {
    it('should return unique user IDs from assets table')
  })

  describe('findByUserIdWithRelations', () => {
    it('should return assets with specified relations loaded')
  })

  describe('saveMany', () => {
    it('should save multiple assets at once')
  })
})
```

### Unit-тесты: HistoricalPriceRepository (`historical-price.repository.spec.ts`)

```
describe('HistoricalPriceRepository', () => {
  describe('savePrice', () => {
    it('should create and save historical price record')
    it('should set correct timestamp and source')
  })

  describe('findByAssetIdDesc', () => {
    it('should return prices ordered by timestamp DESC')
    it('should limit results to specified take value')
    it('should return empty array when no history')
  })

  describe('findByAssetIdWithLimit', () => {
    it('should return prices with limit')
    it('should order by timestamp DESC')
  })

  describe('countOlderThan', () => {
    it('should count historical prices older than threshold for user assets')
    it('should return 0 when no old enough records')
  })
})
```

### Unit-тесты: AssetsService (обновление `assets.service.spec.ts`)

```
describe('AssetsService', () => {
  // Моки должны использовать AssetRepository вместо Repository<Asset>

  describe('findAll', () => {
    it('should call assetRepository.findAll')
  })

  describe('findOne', () => {
    it('should call assetRepository.findOneById')
  })

  describe('create', () => {
    it('should call assetRepository.saveAsset')
  })

  describe('update', () => {
    it('should call assetRepository.updateById and findOneById')
  })

  describe('remove', () => {
    it('should call assetRepository.deleteById')
  })

  describe('refreshAll', () => {
    it('should call assetRepository.findByUserId after update')
  })

  describe('refreshNFTs', () => {
    it('should call assetRepository.findByUserIdAndType with type nft')
  })
})
```

### Unit-тесты: AssetUpdateService (обновление `asset-update.service.spec.ts`)

```
describe('AssetUpdateService', () => {
  // Моки: AssetRepository, HistoricalPriceRepository (User и NotificationSettings — пока @InjectRepository)

  describe('updateAssetsForUsers', () => {
    it('should use assetRepository.findByUserId')
    it('should use assetRepository.saveAsset after price update')
  })

  describe('updateCryptoAsset', () => {
    it('should call historicalPriceRepository.savePrice')
    it('should call assetRepository.saveAsset')
  })

  describe('updateNFTAsset', () => {
    it('should call historicalPriceRepository.savePrice')
    it('should call assetRepository.saveAsset')
  })

  describe('calculateChanges', () => {
    it('should call historicalPriceRepository.findByAssetIdDesc')
  })
})
```

## Ожидаемый результат

1. `AssetRepository` создан с 10+ методами для работы с Asset
2. `HistoricalPriceRepository` создан с 4 методами для работы с HistoricalPrice
3. `AssetsService` использует `AssetRepository` вместо `Repository<Asset>`
4. `AssetUpdateService` использует `AssetRepository` и `HistoricalPriceRepository` (User и NotificationSettings — пока через `@InjectRepository`)
5. `AssetsModule` экспортирует оба репозитория
6. Все unit-тесты проходят

## Критерии приемки

- [ ] `AssetRepository` создан с `@Injectable()` и содержит все необходимые методы
- [ ] `HistoricalPriceRepository` создан с `@Injectable()` и содержит все необходимые методы
- [ ] `AssetsService` не содержит `@InjectRepository(Asset)` — только `AssetRepository`
- [ ] `AssetUpdateService` использует `AssetRepository` и `HistoricalPriceRepository`
- [ ] `AssetsModule` содержит оба репозитория в `providers` и `exports`
- [ ] Все тесты `asset.repository.spec.ts` проходят
- [ ] Все тесты `historical-price.repository.spec.ts` проходят
- [ ] Все тесты `assets.service.spec.ts` проходят с обновленными моками
- [ ] Все тесты `asset-update.service.spec.ts` проходят с обновленными моками
- [ ] JSDoc документация на всех публичных методах
- [ ] Код соответствует конвенциям (strict TypeScript, 2 пробела, одинарные кавычки)
