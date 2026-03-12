# Sub-task 4: Репозиторий модуля user-settings (UserSettingsRepository)

## Описание

Создать кастомный `UserSettingsRepository` для сущности `UserSettings`. Перенести все операции с БД из `UserSettingsService` в репозиторий. Обновить `UserSettingsModule` и тесты.

## Способ решения

### 1. Создать `UserSettingsRepository`

Файл: `backend/src/user-settings/core/user-settings.repository.ts`

Методы для переноса из UserSettingsService:
- `findOneByUserId(userId: number): Promise<UserSettings | null>` — из `getUserSettings()` (строки 33-35), `createSettings()` (строки 54-56), `updateSettings()` (строки 84-86, 101-103)
- `createAndSave(data: Partial<UserSettings>): Promise<UserSettings>` — из `createSettings()` (строки 65-70)
- `updateByUserId(userId: number, data: Partial<UserSettings>): Promise<void>` — из `updateSettings()` (строки 96-99)

### 2. Рефакторинг `UserSettingsService`

- Заменить `@InjectRepository(UserSettings) private readonly userSettingsRepository: Repository<UserSettings>` на `private readonly userSettingsRepository: UserSettingsRepository`
- Заменить прямые вызовы `this.userSettingsRepository.findOne(...)`, `.create(...)`, `.save(...)`, `.update(...)` на методы кастомного репозитория
- Логика шифрования/дешифрования остается в сервисе (это бизнес-логика, не persistence)

### 3. Обновить `UserSettingsModule`

- Добавить `UserSettingsRepository` в `providers`
- Оставить `TypeOrmModule.forFeature([UserSettings])` — нужен для `@InjectRepository()` внутри `UserSettingsRepository`
- Добавить `UserSettingsRepository` в `exports` (на случай если понадобится в других модулях)

## Файлы для изменения/создания

- `backend/src/user-settings/core/user-settings.repository.ts` — **СОЗДАТЬ** кастомный репозиторий
- `backend/src/user-settings/core/user-settings.repository.spec.ts` — **СОЗДАТЬ** unit-тесты
- `backend/src/user-settings/user-settings.service.ts` — **ИЗМЕНИТЬ** инжекцию и вызовы
- `backend/src/user-settings/user-settings.service.spec.ts` — **ИЗМЕНИТЬ** моки
- `backend/src/user-settings/user-settings.module.ts` — **ИЗМЕНИТЬ** providers/exports

## Тесткейсы для TDD

### Unit-тесты: UserSettingsRepository (`user-settings.repository.spec.ts`)

```
describe('UserSettingsRepository', () => {
  describe('findOneByUserId', () => {
    it('should return settings when found by userId')
    it('should return null when settings not found')
  })

  describe('createAndSave', () => {
    it('should create entity from partial data and save')
    it('should return the saved entity')
  })

  describe('updateByUserId', () => {
    it('should call update with correct userId filter')
    it('should pass data to update')
  })
})
```

### Unit-тесты: UserSettingsService (обновление `user-settings.service.spec.ts`)

```
describe('UserSettingsService', () => {
  // Моки должны использовать UserSettingsRepository вместо Repository<UserSettings>

  describe('getUserSettings', () => {
    it('should call userSettingsRepository.findOneByUserId')
    it('should return null when no settings found')
    it('should decrypt settings before returning')
  })

  describe('createSettings', () => {
    it('should call userSettingsRepository.findOneByUserId to check existing')
    it('should throw error when settings already exist')
    it('should call userSettingsRepository.createAndSave with encrypted data')
    it('should return decrypted settings')
  })

  describe('updateSettings', () => {
    it('should call userSettingsRepository.findOneByUserId')
    it('should create settings if not found')
    it('should call userSettingsRepository.updateByUserId with encrypted data')
    it('should call userSettingsRepository.findOneByUserId to return updated')
    it('should return decrypted settings')
  })
})
```

## Ожидаемый результат

1. `UserSettingsRepository` создан с 3 методами для работы с БД
2. `UserSettingsService` использует `UserSettingsRepository` вместо `Repository<UserSettings>`
3. `UserSettingsModule` экспортирует `UserSettingsRepository`
4. Логика шифрования/дешифрования не затронута
5. Все unit-тесты проходят

## Критерии приемки

- [ ] `UserSettingsRepository` создан с `@Injectable()` и содержит методы: `findOneByUserId`, `createAndSave`, `updateByUserId`
- [ ] `UserSettingsService` не содержит `@InjectRepository(UserSettings)` — только `UserSettingsRepository`
- [ ] `UserSettingsService` не содержит прямых вызовов `.findOne(...)`, `.create(...)`, `.save(...)`, `.update(...)`
- [ ] `UserSettingsModule` содержит `UserSettingsRepository` в `providers` и `exports`
- [ ] Все тесты `user-settings.repository.spec.ts` проходят
- [ ] Все тесты `user-settings.service.spec.ts` проходят с обновленными моками
- [ ] Логика шифрования/дешифрования не изменена
- [ ] JSDoc документация на всех публичных методах
- [ ] Код соответствует конвенциям (strict TypeScript, 2 пробела, одинарные кавычки)
