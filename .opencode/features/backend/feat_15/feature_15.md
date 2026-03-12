# Feature 15: Общая инфраструктура `src/common/`

## Описание

Создание общей инфраструктуры в `backend/src/common/` для покрытия проблем #7, #8, #9 из аудита `instructions/problems_backend.md`. Включает создание структуры директорий, глобального фильтра исключений, интерсепторов логирования и трансформации ответов, а также глобальную регистрацию всех компонентов.

## Контекст

### Проблемы из аудита
- **#7 (Высокая):** Отсутствует директория `src/common/` с поддиректориями `guards/`, `filters/`, `interceptors/`, `pipes/`, `decorators/`
- **#8 (Высокая):** Отсутствуют Exception Filters — ноль фильтров исключений в кодовой базе
- **#9 (Высокая):** Отсутствуют Interceptors — ноль интерсепторов в кодовой базе

### Конвенции (из documents_hub)
- **NEST_JS_ARCHITECTURE:** `src/common/` содержит `decorators/`, `filters/`, `guards/`, `interceptors/`, `pipes/`
- **EXCEPTION_FILTER:** Глобальный `AllExceptionsFilter` с `@Catch()`, логированием через `Logger`, стандартизированным JSON-ответом (`statusCode`, `timestamp`, `path`, `message`). Регистрация через `APP_FILTER` в модуле или `app.useGlobalFilters()` в `main.ts`
- **INTERCEPTOR:** `LoggingInterceptor` с `Logger('HTTP')`, замером времени через `Date.now()` + `tap()`. `TransformInterceptor<T>` с обёрткой в `{ data, statusCode, timestamp }`. Регистрация через `APP_INTERCEPTOR` в модуле или `app.useGlobalInterceptors()` в `main.ts`
- **BACKEND_TESTING:** TDD (Red-Green-Refactor), AAA-паттерн (Arrange-Act-Assert), изоляция через `Test.createTestingModule`, моки зависимостей

### Текущее состояние
- `backend/src/common/` — не существует
- Фильтры исключений — 0 штук
- Интерсепторы — 0 штук
- `main.ts` — уже настроен `ValidationPipe` глобально, Swagger, CORS
- `app.module.ts` — корневой модуль без глобальных провайдеров
- TypeScript `strict: true` — включён
- Существующие тесты — 171+ (не должны сломаться)

### Решение по регистрации
Глобальные компоненты регистрируются через `APP_FILTER` / `APP_INTERCEPTOR` в `app.module.ts` (а не через `main.ts`), чтобы они имели доступ к DI-контейнеру NestJS. Это соответствует конвенции из documents_hub.

## Декомпозиция на sub_tasks

| # | Sub-task | Описание | Сложность |
|---|----------|----------|-----------|
| 1 | Структура `src/common/` и `AllExceptionsFilter` | Создать директорию `common/` со всеми поддиректориями. Реализовать `AllExceptionsFilter` с логированием и стандартизированным JSON-ответом | Средняя |
| 2 | `LoggingInterceptor` | Реализовать интерсептор логирования HTTP-запросов с замером времени выполнения | Малая |
| 3 | `TransformInterceptor` | Реализовать интерсептор обёртки ответов в стандартный формат `{ data, statusCode, timestamp }` | Малая |
| 4 | Глобальная регистрация в `app.module.ts` | Зарегистрировать `AllExceptionsFilter`, `LoggingInterceptor`, `TransformInterceptor` через `APP_FILTER` / `APP_INTERCEPTOR` в корневом модуле | Малая |
| 5 | Index-файлы и barrel exports | Создать `index.ts` для каждой поддиректории и корневой `common/index.ts` для удобного импорта | Малая |

## Оценка сложности
- **Общая:** Средняя
- **Трудозатраты:** ~4-6 часов
- **Риски:** Минимальные — новый код, не затрагивает существующий

## Зависимости
- **Входные:** Нет (самостоятельная задача)
- **Выходные:** feat_16 (Roles Guard + @Roles decorator будут размещены в `src/common/guards/` и `src/common/decorators/`)

## Целевая структура

```
backend/src/common/
├── index.ts                              # Barrel export
├── decorators/
│   └── index.ts                          # Пустой (заготовка для feat_16)
├── filters/
│   ├── index.ts
│   ├── all-exceptions.filter.ts
│   └── all-exceptions.filter.spec.ts
├── guards/
│   └── index.ts                          # Пустой (заготовка для feat_16)
├── interceptors/
│   ├── index.ts
│   ├── logging.interceptor.ts
│   ├── logging.interceptor.spec.ts
│   ├── transform.interceptor.ts
│   └── transform.interceptor.spec.ts
└── pipes/
    └── index.ts                          # Пустой (заготовка)
```
