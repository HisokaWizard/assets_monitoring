# Status: feat_6

- **Current:** done
- **Started:** 2026-02-23
- **Completed:** 2026-02-23
- **Current Sub-task:** 

## Прогресс

- [x] sub_task_1.md
- [x] sub_task_2.md
- [x] sub_task_3.md
- [x] sub_task_4.md

## Результат

- entities/user-settings: API слой для управления API ключами
- entities/notification-settings: API слой для настроек мониторинга
- features/profile-settings: Компоненты форм (UserInfo, ApiKeysForm, MonitoringSettingsForm)
- pages/profile: Обновленная страница профиля
- E2E тесты для профиля

## Созданные файлы

```
frontend/src/
├── entities/
│   ├── user-settings/
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── userSettingsApi.ts
│   │   ├── __tests__/
│   │   │   └── userSettingsApi.test.ts
│   │   └── index.ts
│   └── notification-settings/
│       ├── model/
│       │   ├── types.ts
│       │   └── notificationSettingsApi.ts
│       ├── __tests__/
│       │   └── notificationSettingsApi.test.ts
│       └── index.ts
├── features/
│   └── profile-settings/
│       ├── ui/
│       │   ├── UserInfo.tsx
│       │   ├── ApiKeysForm.tsx
│       │   └── MonitoringSettingsForm.tsx
│       ├── model/
│       │   └── useProfileSettings.ts
│       ├── __tests__/
│       │   ├── UserInfo.test.tsx
│       │   ├── ApiKeysForm.test.tsx
│       │   └── MonitoringSettingsForm.test.tsx
│       └── index.ts
└── tests/e2e/
    └── profile.spec.ts
```

## Тесты

- Unit тесты: 108 passed
- E2E тесты: созданы
