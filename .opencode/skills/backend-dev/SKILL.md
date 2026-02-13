# Backend Development

Наш подход к backend разработке на NestJS.

## Когда использовать

- Разработка новых endpoint'ов
- Создание сервисов и репозиториев
- Работа с TypeORM entities

## Архитектура

Мы следуем FSD (Feature-Sliced Design):
- `entities/` — бизнес-сущности
- `features/` — пользовательские сценарии
- `services/` — бизнес-логика
- `controllers/` — HTTP API

## Подход к разработке

1. **Анализ** — понять требования и границы
2. **TDD** — написать тесты (Red)
3. **Реализация** — минимальный код (Green)
4. **Рефакторинг** — улучшить код (Refactor)

## Naming Conventions

- Классы: PascalCase (e.g., `AssetsService`)
- Файлы: kebab-case (e.g., `assets.service.ts`)
- Методы: camelCase (e.g., `findAll()`)
- Константы: UPPER_SNAKE_CASE

## TypeORM

- Использовать декораторы @Entity, @Column
- Всегда указывать типы полей
- Связи через @ManyToOne, @OneToMany

## Тестирование

- Unit тесты для сервисов
- E2E тесты для контроллеров
- Моки для репозиториев

## Примеры

**Создание нового модуля:**
```
Создай модуль для управления уведомлениями
→ Создаётся:
  - notifications.module.ts
  - notifications.service.ts
  - notifications.controller.ts
  - notification.entity.ts
```

**Добавление endpoint:**
```
Добавь endpoint POST /alerts для создания алертов
→ Добавляется метод в контроллер, сервис, DTO
```
