# Sub-task 1: Создать enum `UserRole` и обновить `User` entity

## Описание
Создать TypeScript enum `UserRole` с значениями `USER = 'user'` и `ADMIN = 'admin'`. Обновить сущность `User` — заменить `role: string` на `role: UserRole` с дефолтом `UserRole.USER`.

## Способ решения

### 1. Создать файл `backend/src/auth/user-role.enum.ts`
```typescript
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
```

### 2. Обновить `backend/src/auth/user.entity.ts`
- Импортировать `UserRole` из `./user-role.enum`
- Изменить декоратор `@Column()` на `@Column({ type: 'text', default: UserRole.USER })`
- Изменить тип поля с `string` на `UserRole`

## Файлы для изменения/создания
- `backend/src/auth/user-role.enum.ts` — **СОЗДАТЬ**
- `backend/src/auth/user.entity.ts` — **ИЗМЕНИТЬ**

## Тесткейсы для TDD

### Unit-тесты
```
describe('UserRole enum', () => {
  it('should have USER value equal to "user"', () => {
    expect(UserRole.USER).toBe('user');
  });

  it('should have ADMIN value equal to "admin"', () => {
    expect(UserRole.ADMIN).toBe('admin');
  });

  it('should only contain USER and ADMIN values', () => {
    const values = Object.values(UserRole);
    expect(values).toHaveLength(2);
  });
});
```

## Критерии приёмки
- [ ] Файл `user-role.enum.ts` создан с enum `UserRole`
- [ ] `User` entity использует `UserRole` вместо `string`
- [ ] Все тесты проходят
