# Status: feat_9

- **Current:** done
- **Started:** 2026-03-08 12:00
- **Completed:** 2026-03-08 12:30
- **Current Sub-task:** —

## Описание
Безопасность регистрации: убрать `role` из RegisterDto + UserRole enum

## Прогресс

- [x] sub_task_1.md — Создать enum `UserRole` и обновить `User` entity
- [x] sub_task_2.md — Убрать `role` из `RegisterDto` и исправить `AuthService.register()`
- [x] sub_task_3.md — Обновить `JwtStrategy`, `seed.ts`, `resetAllUserRoles()` на enum
- [x] sub_task_4.md — Обновить все тестовые файлы на использование `UserRole` enum

## Результат

- **Tests:** 168 passed ✅
- **Code-review:** APPROVE ✅

## Исправленные файлы

### Production
- `backend/src/auth/user-role.enum.ts` — создан enum
- `backend/src/auth/user.entity.ts` — role: UserRole
- `backend/src/auth/dto/register.dto.ts` — удалён role
- `backend/src/auth/auth.service.ts` — безопасный register()
- `backend/src/auth/jwt.strategy.ts` — типизация payload
- `backend/src/seed.ts` — UserRole enum

### Tests
- 6 тестовых файлов обновлены
