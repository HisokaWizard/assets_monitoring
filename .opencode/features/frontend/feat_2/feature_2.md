# Feature 2: API авторизации и регистрации пользователя

## Описание задачи

Создание API для авторизации пользователя и регистрации нового аккаунта во frontend приложении. Интеграция с существующим backend API аутентификации.

## Контекст

Согласно архитектуре FSD и backend API:

### Backend endpoints:
- **POST /auth/register** — регистрация нового пользователя
  - Request: `{ email: string, password: string, role: string }`
  - Response: `{ id, email, role, createdAt }`
- **POST /auth/login** — вход пользователя
  - Request: `{ email: string, password: string }`
  - Response: `{ access_token: string }`

### Архитектура FSD:
- **shared/api/** — базовый API клиент и эндпоинты auth
- **entities/user/** — модель пользователя и типы
- **features/auth/** — фичи авторизации (формы, логика)
- **app/providers/** — глобальные провайдеры (Redux store)

### Технический стек:
- **Redux Toolkit** — управление состоянием auth
- **RTK Query** — API запросы и кэширование
- **TypeScript** — строгая типизация

## Декомпозиция

### Sub-task 1: Создание типов и интерфейсов
Создать типы для auth запросов/ответов и модель пользователя в entities/user. **TDD:** Сначала создать тесты типов, затем реализовать интерфейсы.

### Sub-task 2: Создание auth API
Реализовать API endpoints для login и register в shared/api/auth.ts. **TDD:** Сначала написать тесты для endpoints, затем реализовать API.

### Sub-task 3: Создание auth slice
Создать Redux slice для управления состоянием авторизации. **TDD:** Сначала написать тесты для reducers и actions, затем реализовать slice.

### Sub-task 4: Создание API hook'ов
Создать хуки для использования auth API в компонентах. **TDD:** Сначала написать тесты для хуков, затем реализовать их.

## TDD Процесс

Для каждого sub-task:
1. Создать тестовый файл с failing tests
2. Запустить тесты (должны упасть — RED)
3. Реализовать код для прохождения тестов (GREEN)
4. Рефакторинг при необходимости
5. Повторить цикл при необходимости (макс. 5 итераций)

## Оценка сложности

**Сложность:** Medium  
**Ожидаемое время:** 2-3 часа

## Зависимости

- Feature 1 (базовая структура frontend) — выполнено
- Backend auth API — готово
- Testing setup (jest, @testing-library/react) — готово
