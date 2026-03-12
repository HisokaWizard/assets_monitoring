# Sub-task 3: `TransformInterceptor`

## Описание

Реализовать `TransformInterceptor` — интерсептор для обёртки всех успешных ответов API в стандартный формат `{ data, statusCode, timestamp }`. Согласно конвенции INTERCEPTOR из documents_hub, использует оператор `map()` из RxJS для трансформации данных.

## Способ решения

### 1. Определить интерфейс стандартного ответа

Файл: `backend/src/common/interceptors/transform.interceptor.ts`

```typescript
/**
 * Стандартный формат ответа API.
 */
export interface ApiResponse<T> {
  /** Данные ответа. */
  data: T;
  /** HTTP статус-код. */
  statusCode: number;
  /** Временная метка ответа в ISO формате. */
  timestamp: string;
}
```

### 2. Реализовать `TransformInterceptor`

Согласно конвенции INTERCEPTOR из documents_hub:
- Декоратор `@Injectable()`
- Generic класс `TransformInterceptor<T>` реализует `NestInterceptor<T, ApiResponse<T>>`
- Метод `intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>>`:
  1. Вернуть `next.handle().pipe(map(data => ({ ... })))`
  2. Извлечь `statusCode` из `context.switchToHttp().getResponse().statusCode`
  3. Сформировать `timestamp` через `new Date().toISOString()`
  4. Обернуть `data` в стандартный формат

### 3. Типизация

- Generic `T` для типа данных ответа
- `context: ExecutionContext`
- `next: CallHandler<T>`
- Возвращаемый тип: `Observable<ApiResponse<T>>`
- Использовать `Response` из `express` для типизации response

### 4. Граничные случаи

- `null` / `undefined` data — оборачивать как есть (`data: null`)
- Пустой массив — оборачивать как есть (`data: []`)
- Примитивные типы (string, number) — оборачивать как есть

## Файлы для создания

- `backend/src/common/interceptors/transform.interceptor.ts` — реализация + интерфейс `ApiResponse`
- `backend/src/common/interceptors/transform.interceptor.spec.ts` — unit-тесты

## Тесткейсы для TDD

### Unit-тесты (`transform.interceptor.spec.ts`)

```typescript
describe('TransformInterceptor', () => {
  // Setup: создать экземпляр, замокать ExecutionContext и CallHandler

  describe('intercept', () => {
    describe('when response contains object data', () => {
      it('should wrap response in ApiResponse format', () => {
        // Arrange: callHandler.handle returns of({ id: 1, name: 'BTC' })
        // Act: subscribe to interceptor.intercept(context, callHandler)
        // Assert: result === { data: { id: 1, name: 'BTC' }, statusCode: 200, timestamp: '...' }
      });

      it('should include correct statusCode from response', () => {
        // Arrange: response.statusCode = 201
        // Act: subscribe to result
        // Assert: result.statusCode === 201
      });

      it('should include timestamp in ISO format', () => {
        // Act: subscribe to result
        // Assert: result.timestamp matches ISO date regex
      });
    });

    describe('when response contains array data', () => {
      it('should wrap array in ApiResponse format', () => {
        // Arrange: callHandler.handle returns of([{ id: 1 }, { id: 2 }])
        // Assert: result.data === [{ id: 1 }, { id: 2 }]
      });

      it('should wrap empty array in ApiResponse format', () => {
        // Arrange: callHandler.handle returns of([])
        // Assert: result.data === []
      });
    });

    describe('when response contains null or undefined', () => {
      it('should wrap null data in ApiResponse format', () => {
        // Arrange: callHandler.handle returns of(null)
        // Assert: result.data === null
      });

      it('should wrap undefined data in ApiResponse format', () => {
        // Arrange: callHandler.handle returns of(undefined)
        // Assert: result.data === undefined
      });
    });

    describe('when response contains primitive data', () => {
      it('should wrap string data in ApiResponse format', () => {
        // Arrange: callHandler.handle returns of('success')
        // Assert: result.data === 'success'
      });

      it('should wrap number data in ApiResponse format', () => {
        // Arrange: callHandler.handle returns of(42)
        // Assert: result.data === 42
      });
    });

    describe('ApiResponse interface', () => {
      it('should have data, statusCode, and timestamp fields', () => {
        // Act: subscribe to result
        // Assert: result has exactly keys ['data', 'statusCode', 'timestamp']
      });
    });
  });
});
```

## Ожидаемый результат

1. Все успешные ответы API обёрнуты в формат `{ data, statusCode, timestamp }`
2. `statusCode` берётся из реального HTTP-ответа
3. `timestamp` — текущее время в ISO формате
4. Граничные случаи (null, undefined, пустой массив, примитивы) обрабатываются корректно
5. Интерфейс `ApiResponse<T>` экспортирован для использования в других частях приложения

## Критерии приёмки

- [ ] Все unit-тесты проходят
- [ ] `TransformInterceptor` реализует `NestInterceptor` интерфейс
- [ ] Используется `@Injectable()` декоратор
- [ ] Generic типизация `TransformInterceptor<T>`
- [ ] Интерфейс `ApiResponse<T>` экспортирован
- [ ] Формат ответа: `{ data: T, statusCode: number, timestamp: string }`
- [ ] Граничные случаи обработаны (null, undefined, [], примитивы)
- [ ] TypeScript strict: true — без ошибок компиляции
- [ ] Существующие 171+ тестов не сломаны
