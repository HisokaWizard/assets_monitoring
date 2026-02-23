# Sub-task 1: Добавить JWT Guard в NotificationsController

## Описание

Раскомментировать и исправить все методы контроллера для использования JWT авторизации.

## Способ решения

### 1. Импортировать AuthGuard

```typescript
import { AuthGuard } from '@nestjs/passport';
```

### 2. Обновить методы

#### GET /notifications/settings
```typescript
@Get('settings')
@UseGuards(AuthGuard('jwt'))
getSettings(@Request() req) {
  return this.notificationsService.getUserSettings(req.user.id);
}
```

#### POST /notifications/settings
```typescript
@Post('settings')
@UseGuards(AuthGuard('jwt'))
createSettings(@Request() req, @Body() dto: CreateNotificationSettingsDto) {
  return this.notificationsService.createSettings(req.user.id, dto);
}
```

#### PUT /notifications/settings/:id
```typescript
@Put('settings/:id')
@UseGuards(AuthGuard('jwt'))
updateSettings(
  @Request() req,
  @Param('id') id: number,
  @Body() dto: UpdateNotificationSettingsDto,
) {
  return this.notificationsService.updateSettings(+id, req.user.id, dto);
}
```

#### DELETE /notifications/settings/:id
```typescript
@Delete('settings/:id')
@UseGuards(AuthGuard('jwt'))
deleteSettings(@Request() req, @Param('id') id: number) {
  return this.notificationsService.deleteSettings(+id, req.user.id);
}
```

#### GET /notifications/logs
```typescript
@Get('logs')
@UseGuards(AuthGuard('jwt'))
getLogs(@Request() req, @Query('limit') limit?: number) {
  return this.notificationsService.getNotificationLogs(req.user.id, limit ? +limit : 50);
}
```

### 3. Проверить AuthService импорт

Убедиться, что AuthModule или JwtStrategy доступен в NotificationsModule.

## Подготовка тесткейсов для TDD

### Unit тесты для Controller

1. **GET settings - returns user settings**
   - Мокаем пользователя в request
   - Проверяем вызов service с правильным userId

2. **GET settings - unauthorized without token**
   - Запрос без Authorization header
   - Ожидаем 401

3. **POST settings - creates with user id**
   - Мокаем пользователя
   - Проверяем передачу userId в service

4. **PUT settings/:id - updates**
   - Проверяем правильные параметры

5. **DELETE settings/:id - deletes**
   - Проверяем правильные параметры

## Ожидаемый результат

- Все методы защищены @UseGuards(AuthGuard('jwt'))
- userId берется из req.user.id
- Нет hardcoded userId

## Критерии приёмки

- [ ] AuthGuard импортирован
- [ ] GET /settings защищен
- [ ] POST /settings защищен
- [ ] PUT /settings/:id защищен
- [ ] DELETE /settings/:id защищен
- [ ] GET /logs защищен
- [ ] Unit тесты обновлены
