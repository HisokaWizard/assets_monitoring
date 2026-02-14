# Sub-task 1: Создать структуру директорий и перенести базовые компоненты

## Описание
Создать структуру папок для декомпозиции модуля notifications и перенести базовые компоненты (entities, dto, email service, scheduler service).

## Способ решения

### Структура директорий
```
backend/src/notifications/
├── core/
│   ├── entities/
│   │   ├── notification-settings.entity.ts
│   │   └── notification-log.entity.ts
│   └── dto/
│       ├── create-notification-settings.dto.ts
│       ├── update-notification-settings.dto.ts
│       ├── send-notification.dto.ts
│       └── generate-report.dto.ts
├── alerts/
│   ├── alerts.module.ts
│   └── dto/
├── reports/
│   ├── reports.module.ts
│   └── dto/
├── email/
│   ├── email.module.ts
│   └── email.service.ts
├── scheduler/
│   ├── scheduler.module.ts
│   └── scheduler.service.ts
├── notifications.module.ts
├── notifications.controller.ts
├── notifications.service.ts
└── notification.service.ts
```

### Шаги выполнения

1. **Создать директории:**
   ```bash
   mkdir -p core/entities core/dto alerts/dto reports/dto email scheduler
   ```

2. **Перенести entities в core/entities/:**
   - `notification-settings.entity.ts` → `core/entities/`
   - `notification-log.entity.ts` → `core/entities/`

3. **Перенести dto в core/dto/:**
   - `create-notification-settings.dto.ts` → `core/dto/`
   - `update-notification-settings.dto.ts` → `core/dto/`
   - `send-notification.dto.ts` → `core/dto/`
   - `generate-report.dto.ts` → `core/dto/`

4. **Перенести EmailService:**
   - `email.service.ts` → `email/email.service.ts`
   - Создать `email/email.module.ts` с экспортом EmailService

5. **Перенести SchedulerService:**
   - `scheduler.service.ts` → `scheduler/scheduler.service.ts`
   - Создать `scheduler/scheduler.module.ts` с экспортом SchedulerService

6. **Обновить imports:**
   - Во всех файлах обновить пути импорта entities и dto
   - Пример: `from './notification-settings.entity'` → `from './core/entities/notification-settings.entity'`

7. **Создать базовые модули:**
   - `alerts/alerts.module.ts` - пустой пока, будет заполнен в sub_task_2
   - `reports/reports.module.ts` - пустой пока, будет заполнен в sub_task_3

## Файлы для создания/переноса

**Новые директории:**
- `backend/src/notifications/core/entities/`
- `backend/src/notifications/core/dto/`
- `backend/src/notifications/alerts/`
- `backend/src/notifications/reports/`
- `backend/src/notifications/email/`
- `backend/src/notifications/scheduler/`

**Файлы для переноса (с обновлением imports):**
- `core/entities/notification-settings.entity.ts`
- `core/entities/notification-log.entity.ts`
- `core/dto/create-notification-settings.dto.ts`
- `core/dto/update-notification-settings.dto.ts`
- `core/dto/send-notification.dto.ts`
- `core/dto/generate-report.dto.ts`
- `email/email.service.ts`
- `scheduler/scheduler.service.ts`

**Новые файлы:**
- `email/email.module.ts`
- `scheduler/scheduler.module.ts`
- `alerts/alerts.module.ts`
- `reports/reports.module.ts`

## Критерии приёмки

- [ ] Создана структура директорий
- [ ] Entities перенесены в `core/entities/`
- [ ] DTO перенесены в `core/dto/`
- [ ] EmailService перенесен в `email/`
- [ ] SchedulerService перенесен в `scheduler/`
- [ ] Созданы модули email.module.ts и scheduler.module.ts
- [ ] Все imports обновлены корректно
- [ ] Приложение компилируется без ошибок: `npm run build`
- [ ] Существующие тесты проходят: `npm test`
