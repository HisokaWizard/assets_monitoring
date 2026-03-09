# Feature 11: TypeScript `strict: true`

## Описание
Включить `strict: true` в tsconfig.json. Конвенция требует: «TypeScript 5+ с `strict: true`. Никаких `any` без явного обоснования.»

Текущее состояние — несколько флагов в `false`:
- `strictNullChecks: false`
- `noImplicitAny: false`
- `strictBindCallApply: false`
- `forceConsistentCasingInFileNames: false`

## Слой
Backend

## Декомпозиция
1. **sub_task_1.md** — strict mode + общие файлы
2. **sub_task_2.md** — auth модуль
3. **sub_task_3.md** — assets модуль
4. **sub_task_4.md** — notifications модуль
5. **sub_task_5.md** — user-settings модуль
