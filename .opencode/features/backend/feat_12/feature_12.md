# Feature 12: Отключить synchronize + настроить миграции

## Описание
Критическая задача: в production используются ТОЛЬКО миграции. `synchronize: true` допустим только в development.

## Проблема
Файл: `backend/src/app.module.ts:45`
```typescript
synchronize: true,
```

## Решение
1. Изменить `synchronize` на `false` для production
2. Настроить миграции TypeORM
3. Создать скрипты миграций
4. Создать первую миграцию

## Слой
Backend

## Декомпозиция
1. **sub_task_1.md** — Настройка конфигурации миграций
2. **sub_task_2.md** — Создание первой миграции
