# Sub-task 2: Убрать `role` из RegisterDto и исправить AuthService.register()

## Описание
Ключевой security fix: полностью удалить поле `role` из `RegisterDto`. Обновить `AuthService.register()` — убрать spread `...registerDto` и явно назначать `UserRole.USER`.

## Способ решения

### 1. Обновить `backend/src/auth/dto/register.dto.ts`
- Удалить поле `role?: string`
- Удалить импорт `IsOptional`

### 2. Обновить `backend/src/auth/auth.service.ts` — метод `register()`
- Заменить spread на явное перечисление полей:
```typescript
const user = this.usersRepository.create({
  email: registerDto.email,
  password: hashedPassword,
  role: UserRole.USER,
});
```

## Файлы для изменения
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/auth.service.ts`

## Критерии приёмки
- [ ] Поле `role` отсутствует в `RegisterDto`
- [ ] `AuthService.register()` явно назначает `role: UserRole.USER`
- [ ] Нет spread `...registerDto`
