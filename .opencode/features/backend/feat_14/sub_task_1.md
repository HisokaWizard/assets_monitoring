# Sub-task 1: Репозиторий модуля auth (UserRepository)

## Описание

Создать кастомный `UserRepository` для сущности `User`. Перенести все операции с БД из `AuthService` в репозиторий. Обновить `AuthModule` для регистрации нового провайдера. Обновить тесты.

## Способ решения

### 1. Создать `UserRepository`

Файл: `backend/src/auth/user.repository.ts`

По конвенции из documents_hub (REPOSITORY.md) — класс с `@Injectable()`, инжектящий `Repository<User>` через `@InjectRepository()`:

```typescript
@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private readonly repository: Repository<User>) {}
}
```

Методы для переноса из AuthService:
- `findOneById(id: number): Promise<User | null>` — из `getMe()` (строка 50)
- `findOneByEmail(email: string): Promise<User | null>` — из `register()` (строка 70) и `login()` (строка 99)
- `createAndSave(data: Partial<User>): Promise<User>` — из `register()` (строки 78-83)
- `updateAllRoles(role: UserRole): Promise<number>` — из `resetAllUserRoles()` (строка 119)

### 2. Рефакторинг `AuthService`

- Заменить `@InjectRepository(User) private usersRepository: Repository<User>` на `private readonly userRepository: UserRepository`
- Заменить прямые вызовы `this.usersRepository.findOneBy(...)` на методы `UserRepository`
- Бизнес-логика (хэширование, JWT, валидация) остается в сервисе

### 3. Обновить `AuthModule`

- Добавить `UserRepository` в `providers`
- Добавить `UserRepository` в `exports` (нужен в других модулях: AssetUpdateService, NotificationService)

### 4. Обновить тесты

- `auth.service.spec.ts` — заменить мок `Repository<User>` на мок `UserRepository`

## Файлы для изменения/создания

- `backend/src/auth/user.repository.ts` — **СОЗДАТЬ** кастомный репозиторий
- `backend/src/auth/user.repository.spec.ts` — **СОЗДАТЬ** unit-тесты репозитория
- `backend/src/auth/auth.service.ts` — **ИЗМЕНИТЬ** инжекцию и вызовы
- `backend/src/auth/auth.service.spec.ts` — **ИЗМЕНИТЬ** моки
- `backend/src/auth/auth.module.ts` — **ИЗМЕНИТЬ** providers/exports

## Тесткейсы для TDD

### Unit-тесты: UserRepository (`user.repository.spec.ts`)

```
describe('UserRepository', () => {
  describe('findOneById', () => {
    it('should return user when found by id')
    it('should return null when user not found by id')
  })

  describe('findOneByEmail', () => {
    it('should return user when found by email')
    it('should return null when user not found by email')
  })

  describe('createAndSave', () => {
    it('should create and save a new user')
    it('should return the saved user entity')
  })

  describe('updateAllRoles', () => {
    it('should update all users to the specified role')
    it('should return the number of affected rows')
  })
})
```

### Unit-тесты: AuthService (обновление `auth.service.spec.ts`)

```
describe('AuthService', () => {
  // Моки должны использовать UserRepository вместо Repository<User>
  
  describe('getMe', () => {
    it('should call userRepository.findOneById')
    it('should throw UnauthorizedException when user not found')
    it('should return user without password')
  })

  describe('register', () => {
    it('should call userRepository.findOneByEmail to check existing')
    it('should call userRepository.createAndSave with hashed password')
    it('should throw BadRequestException when email already exists')
  })

  describe('login', () => {
    it('should call userRepository.findOneByEmail')
    it('should return access_token on valid credentials')
    it('should throw UnauthorizedException on invalid credentials')
  })

  describe('resetAllUserRoles', () => {
    it('should call userRepository.updateAllRoles')
    it('should return count of updated users')
  })
})
```

## Ожидаемый результат

1. `UserRepository` создан и содержит 4 метода для работы с БД
2. `AuthService` использует `UserRepository` вместо `Repository<User>`
3. `AuthModule` экспортирует `UserRepository` для использования в других модулях
4. Все unit-тесты проходят
5. Бизнес-логика AuthService не изменена (хэширование, JWT, валидация)

## Критерии приемки

- [ ] `UserRepository` создан с декоратором `@Injectable()`
- [ ] `UserRepository` содержит методы: `findOneById`, `findOneByEmail`, `createAndSave`, `updateAllRoles`
- [ ] `AuthService` не содержит `@InjectRepository(User)` — только `UserRepository`
- [ ] `AuthService` не содержит прямых вызовов `this.usersRepository.find*`, `.create`, `.save`, `.update`
- [ ] `AuthModule` содержит `UserRepository` в `providers` и `exports`
- [ ] Все тесты `user.repository.spec.ts` проходят
- [ ] Все тесты `auth.service.spec.ts` проходят с обновленными моками
- [ ] JSDoc документация на всех публичных методах
- [ ] Код соответствует конвенциям (strict TypeScript, 2 пробела, одинарные кавычки)
