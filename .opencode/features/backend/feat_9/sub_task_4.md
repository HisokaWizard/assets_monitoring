# Sub-task 4: Обновить все тестовые файлы на UserRole enum

## Описание
Обновить все тестовые файлы, использующие строковые литералы ролей, на `UserRole` enum.

## Файлы для изменения
- `backend/src/auth/auth.service.spec.ts`
- `backend/src/auth/auth.controller.spec.ts`
- `backend/src/auth/jwt.strategy.spec.ts`
- `backend/src/user-settings/user-settings.service.spec.ts`
- `backend/src/user-settings/user-settings.controller.spec.ts`
- `backend/src/assets/assets.controller.spec.ts`

## Критерии приёмки
- [ ] Все тестовые файлы используют `UserRole` enum
- [ ] `RegisterDto` в тестах не содержит `role`
- [ ] Все тесты проходят
