# Sub-task 4: Глобальная регистрация в `app.module.ts`

## Описание

Зарегистрировать `AllExceptionsFilter`, `LoggingInterceptor` и `TransformInterceptor` как глобальные провайдеры в корневом модуле `app.module.ts` через токены `APP_FILTER` и `APP_INTERCEPTOR`. Это обеспечит их автоматическое применение ко всем маршрутам приложения с доступом к DI-контейнеру NestJS.

## Способ решения

### 1. Регистрация через провайдеры в `app.module.ts`

Согласно конвенциям EXCEPTION_FILTER и INTERCEPTOR из documents_hub, предпочтительный способ глобальной регистрации — через провайдеры модуля (а не через `main.ts`), т.к. это даёт доступ к DI:

```typescript
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [...],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
```

### 2. Порядок регистрации

Порядок важен для интерсепторов:
1. `LoggingInterceptor` — первый (логирует до и после всех остальных)
2. `TransformInterceptor` — второй (оборачивает финальный ответ)

Для фильтров порядок менее критичен, т.к. `AllExceptionsFilter` — единственный глобальный фильтр.

### 3. Не трогать `main.ts`

`main.ts` уже содержит `app.useGlobalPipes(new ValidationPipe(...))`. Фильтры и интерсепторы регистрируются в модуле, а не в `main.ts`, для единообразия и доступа к DI.

### 4. Сохранить существующую структуру

Добавить только блок `providers` к существующему `@Module()` декоратору. Не менять `imports` и другие настройки.

## Файлы для изменения

- `backend/src/app.module.ts` — добавить `providers` с глобальными компонентами

## Тесткейсы для TDD

### Unit-тесты (в рамках существующих или нового `app.module.spec.ts`)

```typescript
describe('AppModule', () => {
  describe('global providers registration', () => {
    it('should compile the module successfully', async () => {
      // Arrange: создать TestingModule с AppModule (с моками для TypeORM и внешних модулей)
      // Act: module.compile()
      // Assert: не бросает ошибку
    });

    it('should register AllExceptionsFilter as APP_FILTER', async () => {
      // Arrange: создать TestingModule
      // Act: получить провайдер APP_FILTER
      // Assert: провайдер является экземпляром AllExceptionsFilter
    });

    it('should register LoggingInterceptor as APP_INTERCEPTOR', async () => {
      // Arrange: создать TestingModule
      // Act: получить провайдеры APP_INTERCEPTOR
      // Assert: один из провайдеров является экземпляром LoggingInterceptor
    });

    it('should register TransformInterceptor as APP_INTERCEPTOR', async () => {
      // Arrange: создать TestingModule
      // Act: получить провайдеры APP_INTERCEPTOR
      // Assert: один из провайдеров является экземпляром TransformInterceptor
    });
  });
});
```

**Примечание:** Тестирование глобальной регистрации модуля может быть сложным из-за зависимостей (TypeORM, HTTP, Schedule). Допустимо использовать упрощённый подход — проверить, что модуль компилируется с замоканными зависимостями, и что провайдеры зарегистрированы. Основная проверка работоспособности — через существующие 171+ тестов (они не должны сломаться).

## Ожидаемый результат

1. `AllExceptionsFilter` применяется глобально ко всем маршрутам
2. `LoggingInterceptor` логирует все входящие запросы
3. `TransformInterceptor` оборачивает все ответы в стандартный формат
4. Все 171+ существующих тестов продолжают проходить
5. Приложение запускается без ошибок

## Критерии приёмки

- [ ] `APP_FILTER` зарегистрирован с `AllExceptionsFilter`
- [ ] `APP_INTERCEPTOR` зарегистрирован с `LoggingInterceptor`
- [ ] `APP_INTERCEPTOR` зарегистрирован с `TransformInterceptor`
- [ ] Регистрация в `app.module.ts` (не в `main.ts`)
- [ ] Существующие 171+ тестов не сломаны
- [ ] Приложение компилируется без ошибок TypeScript
- [ ] JSDoc-комментарии на добавленных провайдерах
