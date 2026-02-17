import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test.beforeEach(async ({ page }) => {
      page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
      page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    });

    test('should display login form', async ({ page }) => {
      await page.waitForSelector('h1', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Вход в систему');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/пароль/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
    });

    test('should show validation errors on empty submit', async ({ page }) => {
      await page.getByRole('button', { name: /войти/i }).click();
      
      await expect(page.getByText(/email обязателен/i)).toBeVisible();
      await expect(page.getByText(/пароль обязателен/i)).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/пароль/i).fill('wrongpassword');
      await page.getByRole('button', { name: /войти/i }).click();
      
      await expect(page.getByText(/ошибка входа/i)).toBeVisible();
    });

    test('should redirect to home on successful login', async ({ page }) => {
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/пароль/i).fill('password123');
      await page.getByRole('button', { name: /войти/i }).click();
      
      await expect(page).toHaveURL('/');
    });

    test('should redirect unauthenticated user to login', async ({ page }) => {
      await page.goto('/');
      
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
