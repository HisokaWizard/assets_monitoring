# Sub-task 3: Обновить JwtStrategy, seed.ts, resetAllUserRoles() на enum

## Описание
Заменить все строковые литералы ролей на `UserRole` enum.

## Способ решения

### 1. Обновить `auth.service.ts` — `resetAllUserRoles()`
- Заменить `{ role: 'user' }` на `{ role: UserRole.USER }`

### 2. Обновить `backend/src/auth/jwt.strategy.ts`
- Создать интерфейс `JwtPayload` с типизацией role
- Типизировать параметр `validate(payload: JwtPayload)`

### 3. Обновить `backend/src/seed.ts`
- Заменить `role: 'admin'` на `role: UserRole.ADMIN`
- Заменить `role: 'user'` на `role: UserRole.USER`

## Файлы для изменения
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/seed.ts`

## Критерии приёмки
- [ ] `resetAllUserRoles()` использует `UserRole.USER`
- [ ] JWT payload типизирован
- [ ] `seed.ts` использует enum
