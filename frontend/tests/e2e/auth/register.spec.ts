import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test.beforeEach(async ({ page }) => {
      page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
      page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
    });

    test('should display registration form', async ({ page }) => {
      await page.waitForSelector('h1', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Регистрация');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/пароль/i)).toBeVisible();
      await expect(page.getByLabel(/подтверждение пароля/i)).toBeVisible();
      await expect(page.getByLabel(/роль/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /зарегистрироваться/i })).toBeVisible();
    });

    test('should show validation errors on empty submit', async ({ page }) => {
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();
      
      await expect(page.getByText(/email обязателен/i)).toBeVisible();
      await expect(page.getByText(/пароль обязателен/i)).toBeVisible();
      await expect(page.getByText(/подтверждение пароля обязательно/i)).toBeVisible();
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await page.getByLabel(/email/i).fill('test@test.com');
      await page.getByLabel(/пароль/i).fill('password123');
      await page.getByLabel(/подтверждение пароля/i).fill('differentpassword');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();
      
      await expect(page.getByText(/пароли не совпадают/i)).toBeVisible();
    });

    test('should navigate to login page when clicking "Уже есть аккаунт"', async ({ page }) => {
      await page.getByText('Уже есть аккаунт? Войти').click();
      
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('h1')).toContainText('Вход в систему');
    });

    test('should show link to registration on login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByText('Нет аккаунта? Зарегистрироваться')).toBeVisible();
    });

    test('should navigate to registration from login page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      await page.getByText('Нет аккаунта? Зарегистрироваться').click();
      
      await expect(page).toHaveURL(/\/register/);
    });
  });
});
