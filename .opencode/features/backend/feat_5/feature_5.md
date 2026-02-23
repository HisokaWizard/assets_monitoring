# Feature 5: Добавить JWT Guard для notifications/settings

## Описание

Защитить эндпоинты `/notifications/settings*` авторизацией JWT. Сейчас Guard закомментирован в контроллере.

## Контекст

### Текущее состояние

В `backend/src/notifications/notifications.controller.ts`:
```typescript
@Get('settings')
// @UseGuards(JwtAuthGuard)  // <-- ЗАКОММЕНТИРОВАНО
getSettings(/* @GetUser() user: User */) {
  const userId = 1; // Hardcoded
  return this.notificationsService.getUserSettings(userId);
}
```

### Требуемое состояние

```typescript
@Get('settings')
@UseGuards(AuthGuard('jwt'))
getSettings(@Request() req) {
  return this.notificationsService.getUserSettings(req.user.id);
}
```

### Стек
- NestJS
- @nestjs/passport
- JWT Strategy (уже есть в `auth/jwt.strategy.ts`)

## Декомпозиция

### Sub-task 1: Добавить JWT Guard в NotificationsController
Раскомментировать и исправить все методы контроллера.

- **Сложность**: Low
- **Зависимости**: Нет

### Sub-task 2: Обновить сервис и написать тесты
Убрать hardcoded userId, использовать req.user.id. Написать тесты.

- **Сложность**: Medium
- **Зависимости**: Sub-task 1

## Ожидаемый результат

1. Все методы `/notifications/settings*` защищены JWT
2. userId берется из JWT токена (req.user.id)
3. Unit и E2E тесты обновлены
4. Нет hardcoded userId = 1

## Риски

- Изменение API контракта (теперь нужен Authorization header)
- Существующие E2E тесты могут сломаться
