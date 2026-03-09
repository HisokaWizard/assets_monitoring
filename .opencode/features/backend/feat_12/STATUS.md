# Status: feat_12

- **Current:** done
- **Started:** 2026-03-08 15:30
- **Completed:** 2026-03-09 10:50
- **Current Sub-task:** —

## Описание
Миграции — отключить `synchronize` + настроить миграции

## Прогресс

- [x] sub_task_1.md — Настройка конфигурации миграций
- [x] sub_task_2.md — Создание первой миграции

## Результат

- **Build:** 0 ошибок ✅
- **Tests:** 171 passed ✅

## Изменённые файлы

### Production
- `backend/src/app.module.ts` — synchronize по окружению, migrations + migrationsRun: true
- `backend/src/data-source.ts` — добавлен dotenv/config, JSDoc
- `backend/src/database/migrations/1741500000000-InitialSchema.ts` — создана первая миграция (7 таблиц)
- `backend/package.json` — скрипты migration:generate/run/revert
