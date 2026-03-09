# Sub-task 1: Настройка конфигурации миграций TypeORM

## Описание
Настроить TypeORM для работы с миграциями.

## Способ решения

### 1. Изменить app.module.ts
```typescript
synchronize: process.env.NODE_ENV !== 'production',
```

### 2. Создать директорию
- `backend/src/database/migrations/`

### 3. Добавить скрипты в package.json
```json
"migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/data-source.ts",
"migration:run": "typeorm-ts-node-commonjs migration:run -d src/data-source.ts",
"migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/data-source.ts"
```

### 4. Создать data-source.ts

## Файлы для изменения
- backend/src/app.module.ts
- backend/package.json
- backend/src/data-source.ts (создать)

## Критерии приёмки
- [ ] synchronize: false для production
- [ ] Скрипты миграций работают
- [ ] data-source.ts создан
