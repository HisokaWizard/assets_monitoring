# Sub-task 4: Реализовать ProfilePage и тесты

## Описание

Обновить страницу профиля с новым функционалом и написать E2E тесты.

## Зависимости

- Sub-task 3: Компоненты форм для настроек

## Способ решения

### 1. Обновить структуру страницы

```
src/
├── pages/
│   └── profile/
│       ├── ProfilePage.tsx          # Основная страница
│       ├── index.ts                 # Public API
│       └── __tests__/
│           ├── ProfilePage.test.tsx # Unit тесты
│           └── ProfilePage.integration.test.tsx
```

### 2. Обновить ProfilePage.tsx

Структура страницы:

```tsx
<Container maxWidth="lg">
  <Typography variant="h3">Profile</Typography>
  
  <Grid container spacing={3}>
    {/* Левая колонка - информация */}
    <Grid item xs={12} md={4}>
      <UserInfo 
        email={user.email}
        role={user.role}
        createdAt={user.createdAt}
      />
    </Grid>
    
    {/* Правая колонка - настройки */}
    <Grid item xs={12} md={8}>
      {/* API Keys Section */}
      <ApiKeysForm ... />
      
      {/* Monitoring Settings Section */}
      <MonitoringSettingsForm ... />
    </Grid>
  </Grid>
</Container>
```

### 3. Интеграция с Redux

```tsx
const ProfilePage = () => {
  const user = useAppSelector(selectCurrentUser);
  const { data: userSettings } = useGetUserSettingsQuery();
  const { data: notificationSettings } = useGetNotificationSettingsQuery();
  const [updateUserSettings] = useUpdateUserSettingsMutation();
  const [updateNotificationSettings] = useUpdateNotificationSettingsMutation();
  
  // Обработчики форм
  const handleApiKeysSubmit = async (data) => {
    await updateUserSettings(data).unwrap();
  };
  
  const handleMonitoringSubmit = async (assetType, data) => {
    const settings = findSettingsByType(notificationSettings, assetType);
    await updateNotificationSettings({ id: settings.id, data }).unwrap();
  };
  
  return ( ... );
};
```

### 4. Обработка состояний

- Loading: Skeleton или CircularProgress
- Error: Alert с сообщением ошибки
- Unauthorized: Редирект на /login

### 5. E2E тест (Playwright)

Создать файл `e2e/profile.spec.ts`:

```typescript
test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Логин перед каждым тестом
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/home');
  });

  test('should display user information', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('should update API keys', async ({ page }) => {
    await page.goto('/profile');
    await page.fill('[name="coinmarketcapApiKey"]', 'new-test-api-key-12345');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should toggle crypto monitoring', async ({ page }) => {
    await page.goto('/profile');
    const switchEl = page.locator('[data-testid="crypto-enabled-switch"]');
    await switchEl.click();
    // Проверить сохранение
  });

  test('should update threshold percent', async ({ page }) => {
    await page.goto('/profile');
    // Изменить slider/select
    // Проверить сохранение
  });
});
```

## Подготовка тесткейсов для TDD

### Unit тесты для ProfilePage (`__tests__/ProfilePage.test.tsx`)

1. **Renders user info section**
2. **Renders API keys form**
3. **Renders monitoring settings form**
4. **Shows loading state**
5. **Shows error state**
6. **Redirects to login when not authenticated**

### Integration тесты (`__tests__/ProfilePage.integration.test.tsx`)

7. **Loads user settings on mount**
8. **Loads notification settings on mount**
9. **Updates user settings on form submit**
10. **Updates notification settings on form submit**
11. **Shows success message after save**

### E2E тесты (`e2e/profile.spec.ts`)

12. **Displays user information**
13. **Updates CoinMarketCap API key**
14. **Updates OpenSea API key**
15. **Toggles crypto monitoring enabled**
16. **Toggles NFT monitoring enabled**
17. **Updates crypto threshold percent**
18. **Updates NFT threshold percent**
19. **Updates crypto update interval**
20. **Updates NFT update interval**

## Ожидаемый результат

- ProfilePage обновлена с новым функционалом
- Отображается информация о пользователе
- Работают формы для API ключей
- Работают формы для настроек мониторинга (раздельно crypto/nft)
- Unit и E2E тесты проходят

## Критерии приёмки

- [ ] ProfilePage отображает email, role, createdAt
- [ ] Форма API ключей работает (сохранение, валидация)
- [ ] Формы мониторинга работают раздельно для crypto и nft
- [ ] Loading/error states корректны
- [ ] Unit тесты написаны и проходят
- [ ] Integration тесты написаны и проходят
- [ ] E2E тесты написаны и проходят
