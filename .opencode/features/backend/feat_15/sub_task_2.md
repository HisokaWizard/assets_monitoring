# Sub-task 2: `LoggingInterceptor`

## Описание

Реализовать `LoggingInterceptor` — интерсептор для логирования входящих HTTP-запросов и исходящих ответов с замером времени выполнения. Согласно конвенции INTERCEPTOR из documents_hub, использует `Logger('HTTP')` и оператор `tap()` из RxJS.

## Способ решения

### 1. Реализовать `LoggingInterceptor`

Файл: `backend/src/common/interceptors/logging.interceptor.ts`

Согласно конвенции INTERCEPTOR из documents_hub:
- Декоратор `@Injectable()`
- Реализует интерфейс `NestInterceptor`
- Приватное поле `logger = new Logger('HTTP')`
- Метод `intercept(context: ExecutionContext, next: CallHandler): Observable<any>`:
  1. Извлечь `request` из `context.switchToHttp().getRequest()`
  2. Получить `method` и `url` из request
  3. Зафиксировать `now = Date.now()`
  4. Вернуть `next.handle().pipe(tap(() => this.logger.log(...)))`
  5. Формат лога: `${method} ${url} - ${Date.now() - now}ms`

### 2. Типизация

- `context: ExecutionContext`
- `next: CallHandler`
- `request` типизировать как `Request` из `express`
- Возвращаемый тип: `Observable<unknown>`

### 3. Обработка ошибок в pipe

Добавить `catchError` для логирования ошибочных запросов (с указанием статуса ошибки и времени), чтобы логировались не только успешные, но и неуспешные запросы. Ошибка после логирования пробрасывается дальше через `throwError`.

## Файлы для создания

- `backend/src/common/interceptors/logging.interceptor.ts` — реализация
- `backend/src/common/interceptors/logging.interceptor.spec.ts` — unit-тесты

## Тесткейсы для TDD

### Unit-тесты (`logging.interceptor.spec.ts`)

```typescript
describe('LoggingInterceptor', () => {
  // Setup: создать экземпляр, замокать ExecutionContext и CallHandler

  describe('intercept', () => {
    describe('when request completes successfully', () => {
      it('should call next.handle()', () => {
        // Arrange: callHandler.handle returns of('result')
        // Act: interceptor.intercept(context, callHandler)
        // Assert: callHandler.handle called once
      });

      it('should log request method and URL with execution time', () => {
        // Arrange: request = { method: 'GET', url: '/api/assets' }
        // Act: subscribe to interceptor.intercept(context, callHandler)
        // Assert: Logger.log called with 'GET /api/assets - Xms'
      });

      it('should pass through the response data unchanged', () => {
        // Arrange: callHandler.handle returns of({ id: 1, name: 'BTC' })
        // Act: subscribe to result
        // Assert: result === { id: 1, name: 'BTC' }
      });
    });

    describe('when request fails with error', () => {
      it('should log error request with execution time', () => {
        // Arrange: callHandler.handle returns throwError(() => new HttpException('Not Found', 404))
        // Act: subscribe to interceptor.intercept(context, callHandler)
        // Assert: Logger.error called with 'GET /api/assets - Xms - 404'
      });

      it('should re-throw the original error', () => {
        // Arrange: callHandler.handle returns throwError
        // Act & Assert: observable emits error
      });
    });

    describe('execution time measurement', () => {
      it('should measure time between request start and response', () => {
        // Arrange: mock Date.now to return controlled values
        // Act: subscribe to interceptor.intercept(context, callHandler)
        // Assert: logged time matches expected duration
      });
    });
  });
});
```

## Ожидаемый результат

1. `LoggingInterceptor` логирует каждый HTTP-запрос с методом, URL и временем выполнения
2. Успешные запросы логируются через `Logger.log`
3. Ошибочные запросы логируются через `Logger.error` с кодом ошибки
4. Данные ответа проходят через интерсептор без изменений
5. Ошибки пробрасываются дальше после логирования

## Критерии приёмки

- [ ] Все unit-тесты проходят
- [ ] `LoggingInterceptor` реализует `NestInterceptor` интерфейс
- [ ] Используется `@Injectable()` декоратор
- [ ] Логирование через `Logger('HTTP')` из `@nestjs/common`
- [ ] Формат лога: `${method} ${url} - ${duration}ms`
- [ ] Ошибки логируются и пробрасываются дальше
- [ ] Данные ответа не модифицируются
- [ ] TypeScript strict: true — без ошибок компиляции
- [ ] Существующие 171+ тестов не сломаны
