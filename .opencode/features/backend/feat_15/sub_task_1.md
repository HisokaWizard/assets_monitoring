# Sub-task 1: Структура `src/common/` и `AllExceptionsFilter`

## Описание

Создать директорию `backend/src/common/` со всеми поддиректориями (`decorators/`, `filters/`, `guards/`, `interceptors/`, `pipes/`) согласно конвенции NEST_JS_ARCHITECTURE. Реализовать `AllExceptionsFilter` — глобальный фильтр исключений, который перехватывает все необработанные ошибки, логирует их и возвращает стандартизированный JSON-ответ клиенту.

## Способ решения

### 1. Создать структуру директорий
```
backend/src/common/
├── decorators/
├── filters/
├── guards/
├── interceptors/
└── pipes/
```

### 2. Реализовать `AllExceptionsFilter`

Файл: `backend/src/common/filters/all-exceptions.filter.ts`

Согласно конвенции EXCEPTION_FILTER из documents_hub:
- Декоратор `@Catch()` без аргументов — перехватывает ВСЕ исключения
- Реализует интерфейс `ExceptionFilter`
- Использует `Logger` из `@nestjs/common` с именем `AllExceptionsFilter`
- Определяет HTTP-статус: `HttpException` → `exception.getStatus()`, иначе → `500`
- Извлекает сообщение: `HttpException` → `exception.getResponse()`, иначе → `'Internal server error'`
- Логирует: `${method} ${url}` + stack trace (если есть)
- **Не отправляет stack trace клиенту** (best practice: "Don't expose internals")
- Формат ответа:
  ```json
  {
    "statusCode": 500,
    "timestamp": "2026-03-12T10:00:00.000Z",
    "path": "/api/users",
    "message": "Internal server error"
  }
  ```

### 3. Обработка `HttpException.getResponse()`

`getResponse()` может вернуть `string` или `object` (например, `{ message: [...], error: '...' }` от `ValidationPipe`). Нужно корректно обработать оба случая:
- Если `string` — использовать как `message`
- Если `object` — использовать как есть (spread в ответ) или извлечь `message`

### 4. Типизация

- `exception: unknown` (т.к. `@Catch()` без аргументов)
- `host: ArgumentsHost`
- Использовать `Response` из `express` для типизации `response`
- Использовать `Request` из `express` для типизации `request`

## Файлы для создания

- `backend/src/common/filters/all-exceptions.filter.ts` — реализация фильтра
- `backend/src/common/filters/all-exceptions.filter.spec.ts` — unit-тесты

## Тесткейсы для TDD

### Unit-тесты (`all-exceptions.filter.spec.ts`)

```typescript
describe('AllExceptionsFilter', () => {
  // Setup: создать экземпляр фильтра, замокать ArgumentsHost

  describe('catch', () => {
    describe('when HttpException is thrown', () => {
      it('should return response with correct status code from HttpException', () => {
        // Arrange: new HttpException('Not Found', 404)
        // Act: filter.catch(exception, host)
        // Assert: response.status(404), body.statusCode === 404
      });

      it('should return string message from HttpException', () => {
        // Arrange: new HttpException('Custom error', 400)
        // Act: filter.catch(exception, host)
        // Assert: body.message === 'Custom error'
      });

      it('should return object message from HttpException (validation errors)', () => {
        // Arrange: new BadRequestException({ message: ['email must be valid'], error: 'Bad Request' })
        // Act: filter.catch(exception, host)
        // Assert: body.message содержит массив ошибок валидации
      });

      it('should include timestamp in ISO format', () => {
        // Assert: body.timestamp matches ISO date pattern
      });

      it('should include request path', () => {
        // Arrange: request.url = '/api/users'
        // Assert: body.path === '/api/users'
      });
    });

    describe('when non-HttpException is thrown', () => {
      it('should return 500 Internal Server Error', () => {
        // Arrange: new Error('Database connection failed')
        // Act: filter.catch(exception, host)
        // Assert: response.status(500), body.statusCode === 500
      });

      it('should return generic message without exposing internals', () => {
        // Arrange: new Error('Sensitive DB error details')
        // Act: filter.catch(exception, host)
        // Assert: body.message === 'Internal server error'
      });

      it('should log error with stack trace', () => {
        // Arrange: spy on Logger.error
        // Act: filter.catch(new Error('test'), host)
        // Assert: Logger.error called with method, url, and stack
      });
    });

    describe('when unknown exception type is thrown', () => {
      it('should handle non-Error objects gracefully', () => {
        // Arrange: filter.catch('string error', host)
        // Act & Assert: response.status(500), no crash
      });

      it('should handle null/undefined exceptions', () => {
        // Arrange: filter.catch(null, host)
        // Act & Assert: response.status(500), no crash
      });
    });
  });
});
```

## Ожидаемый результат

1. Директория `backend/src/common/` создана со всеми поддиректориями
2. `AllExceptionsFilter` корректно перехватывает все типы исключений
3. HTTP-исключения возвращают свой статус-код и сообщение
4. Неизвестные исключения возвращают 500 без утечки внутренних деталей
5. Все ошибки логируются через `Logger` с контекстом (method, url, stack)
6. Формат ответа стандартизирован: `{ statusCode, timestamp, path, message }`

## Критерии приёмки

- [ ] Все unit-тесты проходят
- [ ] `AllExceptionsFilter` реализует `ExceptionFilter` интерфейс
- [ ] Используется `@Catch()` декоратор без аргументов
- [ ] Логирование через `Logger` из `@nestjs/common`
- [ ] Stack trace НЕ отправляется клиенту
- [ ] Корректная обработка `HttpException`, `Error`, и произвольных объектов
- [ ] TypeScript strict: true — без ошибок компиляции
- [ ] Существующие 171+ тестов не сломаны
