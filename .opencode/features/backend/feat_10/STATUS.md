# Status: feat_10

- **Current:** done
- **Started:** 2026-03-08 14:50
- **Completed:** 2026-03-08 15:00
- **Current Sub-task:** —

## Описание
Безопасность JWT: убрать fallback секрета

## Проблема
Файл: `backend/src/auth/auth.module.ts:35`
```typescript
secret: process.env.JWT_SECRET || 'secret'  // УЯЗВИМОСТЬ!
```

## Решение
- Добавлен `OnModuleInit` — при отсутствии JWT_SECRET приложение падает с понятной ошибкой
- Убран fallback `'secret'`

## Прогресс

- [x] sub_task_1.md — Убрать JWT secret fallback + добавить валидацию

## Результат

- **Tests:** 171 passed ✅
- **Code-review:** APPROVE ✅

## Изменённые файлы

- `backend/src/auth/auth.module.ts` — добавлен OnModuleInit, убран fallback
- `backend/src/auth/auth.module.spec.ts` — добавлены тесты
