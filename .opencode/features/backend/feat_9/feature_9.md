# Feature 9: Безопасность регистрации — убрать `role` из RegisterDto + UserRole enum

## Описание
Критическая уязвимость безопасности: пользователь может передать `role: 'admin'` при регистрации через POST /auth/register и получить права администратора. Необходимо:
1. Создать enum `UserRole` для типобезопасности
2. Полностью убрать поле `role` из `RegisterDto`
3. Явно назначать `UserRole.USER` при регистрации (не через spread)
4. Заменить все строковые литералы ролей на enum

## Слой
Backend

## Декомпозиция
1. **sub_task_1.md** — Создать enum `UserRole` и обновить `User` entity
2. **sub_task_2.md** — Убрать `role` из `RegisterDto` и исправить `AuthService.register()`
3. **sub_task_3.md** — Обновить `JwtStrategy`, `seed.ts`, `resetAllUserRoles()` на enum
4. **sub_task_4.md** — Обновить все тестовые файлы на использование `UserRole` enum

## Зависимости
- sub_task_2 зависит от sub_task_1
- sub_task_3 зависит от sub_task_1
- sub_task_4 зависит от sub_task_1, sub_task_2, sub_task_3
