# Sub-task 3: Создать компоненты форм для настроек

## Описание

Создать UI компоненты для управления настройками пользователя в соответствии с FSD архитектурой.

## Зависимости

- Sub-task 1: API слой для user-settings
- Sub-task 2: API слой для notification-settings

## Способ решения

### 1. Создать структуру в FSD архитектуре

```
src/
├── features/
│   └── profile-settings/
│       ├── ui/
│       │   ├── ApiKeysForm.tsx           # Форма API ключей
│       │   ├── MonitoringSettingsForm.tsx # Форма настроек мониторинга
│       │   └── UserInfo.tsx              # Информация о пользователе
│       ├── model/
│       │   └── useProfileSettings.ts     # Хук для управления формами
│       └── index.ts                      # Public API
```

### 2. Компонент UserInfo

Отображает:
- Email пользователя
- Роль (user/admin)
- Дату создания аккаунта

```tsx
interface UserInfoProps {
  email: string;
  role: string;
  createdAt: string;
}
```

Использует MUI: Card, Typography, Chip

### 3. Компонент ApiKeysForm

Форма с полями:
- CoinMarketCap API Key (TextField, type=password)
- OpenSea API Key (TextField, type=password)
- Кнопка Save

```tsx
interface ApiKeysFormProps {
  initialData?: UserSettings;
  onSubmit: (data: UpdateUserSettingsDto) => Promise<void>;
  isLoading?: boolean;
}
```

Функционал:
- Показывать маску существующих ключей (************abc)
- Валидация длины ключа (min 20 символов)
- Success/error snackbar

### 4. Компонент MonitoringSettingsForm

Форма с настройками РАЗДЕЛЬНО для crypto и nft:

```tsx
interface MonitoringSettingsFormProps {
  cryptoSettings?: NotificationSettings;
  nftSettings?: NotificationSettings;
  onSubmit: (assetType: AssetType, data: UpdateNotificationSettingsDto) => Promise<void>;
  isLoading?: boolean;
}
```

UI структура:
```
<Card>
  <CardHeader title="Crypto Monitoring" />
  <CardContent>
    - Switch: Enabled
    - Slider/Select: Threshold % (1-50)
    - Select: Update Interval Hours (2,4,6,8,10,12)
  </CardContent>
</Card>

<Card>
  <CardHeader title="NFT Monitoring" />
  <CardContent>
    - Switch: Enabled
    - Slider/Select: Threshold % (1-50)
    - Select: Update Interval Hours (2,4,6,8,10,12)
  </CardContent>
</Card>
```

MUI компоненты: Card, Switch, Slider, Select, FormControlLabel

### 5. Хук useProfileSettings

Инкапсулирует логику:
- Загрузка настроек через RTK Query
- Обработка сабмитов форм
- Управление состоянием loading/error

## Подготовка тесткейсов для TDD

### Unit тесты для UserInfo (`__tests__/UserInfo.test.tsx`)

1. **Renders user email**
2. **Renders role as chip**
3. **Renders created date formatted**

### Unit тесты для ApiKeysForm (`__tests__/ApiKeysForm.test.tsx`)

4. **Renders with empty initial data**
5. **Renders with existing keys masked**
6. **Shows validation error for short key**
7. **Calls onSubmit with form data**
8. **Disables submit while loading**
9. **Shows success snackbar after save**

### Unit тесты для MonitoringSettingsForm (`__tests__/MonitoringSettingsForm.test.tsx`)

10. **Renders both crypto and nft sections**
11. **Renders with existing settings**
12. **Updates crypto enabled switch**
13. **Updates threshold slider**
14. **Updates interval select**
15. **Calls onSubmit with correct data**
16. **Disables while loading**

### Unit тесты для useProfileSettings (`__tests__/useProfileSettings.test.tsx`)

17. **Loads user settings on mount**
18. **Loads notification settings on mount**
19. **Handles update user settings**
20. **Handles update notification settings**

## Ожидаемый результат

- Компоненты созданы в `src/features/profile-settings/`
- Формы работают с валидацией
- Switch, Slider, Select для настроек мониторинга
- Loading и error states
- Unit тесты проходят

## Критерии приёмки

- [ ] Компонент `UserInfo` отображает email, role, createdAt
- [ ] Компонент `ApiKeysForm` с полями для API ключей
- [ ] Компонент `MonitoringSettingsForm` с раздельными настройками crypto/nft
- [ ] Валидация форм работает
- [ ] Loading/error states отображаются
- [ ] Unit тесты написаны и проходят
- [ ] Public API экспортирует компоненты и хук
