# Sub-task 1: strict mode + общие файлы

## Описание
Включить `strict: true` в tsconfig.json и исправить ошибки в общих файлах.

## Способ решения

### 1. Обновить `backend/tsconfig.json`
Заменить все флаги на `"strict": true`:
```json
{
  "compilerOptions": {
    "strict": true,
    // удалить: strictNullChecks, noImplicitAny, strictBindCallApply
  }
}
```

### 2. Исправить `backend/src/main.ts`
- Типизация параметров если есть

### 3. Исправить `backend/src/app.module.ts`
- Проверить типы

## Файлы для изменения
- `backend/tsconfig.json`
- `backend/src/main.ts`
- `backend/src/app.module.ts`

## Критерии приёмки
- [ ] tsconfig.json имеет "strict": true
- [ ] Компиляция без ошибок (кроме тестов)
