# Sub-task 5: Index-файлы и barrel exports

## Описание

Создать `index.ts` (barrel exports) для каждой поддиректории `src/common/` и корневой `common/index.ts`. Это обеспечит удобный импорт компонентов из единой точки входа: `import { AllExceptionsFilter, LoggingInterceptor, TransformInterceptor, ApiResponse } from './common'`.

## Способ решения

### 1. Создать index-файлы для каждой поддиректории

**`backend/src/common/filters/index.ts`:**
```typescript
export { AllExceptionsFilter } from './all-exceptions.filter';
```

**`backend/src/common/interceptors/index.ts`:**
```typescript
export { LoggingInterceptor } from './logging.interceptor';
export { TransformInterceptor, ApiResponse } from './transform.interceptor';
```

**`backend/src/common/guards/index.ts`:**
```typescript
// Guards will be added in feat_16 (RolesGuard)
```

**`backend/src/common/decorators/index.ts`:**
```typescript
// Decorators will be added in feat_16 (@Roles)
```

**`backend/src/common/pipes/index.ts`:**
```typescript
// Custom pipes will be added as needed
```

### 2. Создать корневой index

**`backend/src/common/index.ts`:**
```typescript
export * from './filters';
export * from './interceptors';
export * from './guards';
export * from './decorators';
export * from './pipes';
```

### 3. Обновить импорты в `app.module.ts`

Заменить прямые импорты на barrel imports:
```typescript
// Было:
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Стало:
import { AllExceptionsFilter, LoggingInterceptor, TransformInterceptor } from './common';
```

## Файлы для создания

- `backend/src/common/filters/index.ts`
- `backend/src/common/interceptors/index.ts`
- `backend/src/common/guards/index.ts`
- `backend/src/common/decorators/index.ts`
- `backend/src/common/pipes/index.ts`
- `backend/src/common/index.ts`

## Файлы для изменения

- `backend/src/app.module.ts` — обновить импорты на barrel exports

## Тесткейсы для TDD

### Unit-тесты (`common/index.spec.ts`)

```typescript
describe('common barrel exports', () => {
  describe('filters', () => {
    it('should export AllExceptionsFilter', () => {
      // Arrange: import { AllExceptionsFilter } from './common'
      // Assert: AllExceptionsFilter is defined and is a class
    });
  });

  describe('interceptors', () => {
    it('should export LoggingInterceptor', () => {
      // Arrange: import { LoggingInterceptor } from './common'
      // Assert: LoggingInterceptor is defined and is a class
    });

    it('should export TransformInterceptor', () => {
      // Arrange: import { TransformInterceptor } from './common'
      // Assert: TransformInterceptor is defined and is a class
    });
  });

  describe('re-exports', () => {
    it('should re-export all filters from common/index', () => {
      // Assert: AllExceptionsFilter accessible from './common'
    });

    it('should re-export all interceptors from common/index', () => {
      // Assert: LoggingInterceptor, TransformInterceptor accessible from './common'
    });
  });
});
```

**Примечание:** Тесты barrel exports — это скорее smoke-тесты, проверяющие что экспорты не сломаны. Основная ценность — в предотвращении регрессий при добавлении новых компонентов.

## Ожидаемый результат

1. Все компоненты `src/common/` доступны через единую точку входа `import { ... } from './common'`
2. Пустые index-файлы для `guards/`, `decorators/`, `pipes/` готовы для feat_16 и будущих задач
3. Импорты в `app.module.ts` используют barrel exports
4. Все 171+ существующих тестов продолжают проходить

## Критерии приёмки

- [ ] Все index-файлы созданы
- [ ] Корневой `common/index.ts` реэкспортирует все поддиректории
- [ ] Импорты в `app.module.ts` обновлены на barrel exports
- [ ] Все компоненты доступны через `import { ... } from './common'`
- [ ] Smoke-тесты barrel exports проходят
- [ ] Существующие 171+ тестов не сломаны
- [ ] TypeScript strict: true — без ошибок компиляции
