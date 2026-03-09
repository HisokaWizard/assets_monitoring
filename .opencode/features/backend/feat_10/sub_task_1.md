# Sub-task 1: Убрать JWT secret fallback + добавить валидацию

## Описание
Убрать критический fallback `'secret'` в `auth.module.ts` и добавить проверку при инициализации модуля.

## Способ решения

### 1. Обновить `backend/src/auth/auth.module.ts`
- Добавить импорт `OnModuleInit` из `@nestjs/common`
- Реализовать интерфейс `OnModuleInit`
- Добавить метод `onModuleInit()` с проверкой `JWT_SECRET`
- Убрать fallback из `JwtModule.register()`

```typescript
import { Module, OnModuleInit } from '@nestjs/common';

@Module({...})
export class AuthModule implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is not set. ' +
        'Application cannot start without secure JWT secret.'
      );
    }
  }
}
```

### 2. Обновить конфигурацию JwtModule
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,  // Без fallback!
  signOptions: { expiresIn: '2h' },
}),
```

## Файлы для изменения
- `backend/src/auth/auth.module.ts`

## Тесткейсы для TDD

### Unit-тесты
```typescript
describe('AuthModule', () => {
  describe('when JWT_SECRET is not set', () => {
    it('should throw error during module initialization', async () => {
      delete process.env.JWT_SECRET;
      const { AuthModule } = await import('./auth.module');
      const module = new AuthModule();
      await expect(module.onModuleInit()).rejects.toThrow('JWT_SECRET');
    });
  });

  describe('when JWT_SECRET is set', () => {
    it('should not throw error', async () => {
      process.env.JWT_SECRET = 'test-secret';
      const { AuthModule } = await import('./auth.module');
      const module = new AuthModule();
      await expect(module.onModuleInit()).resolves.not.toThrow();
    });
  });
});
```

## Критерии приёмки
- [ ] Нет fallback 'secret' в коде
- [ ] При отсутствии JWT_SECRET приложение падает с ошибкой
- [ ] При наличии JWT_SECRET приложение запускается нормально
- [ ] Тесты проходят
