import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/home');
  });

  test('should display user information', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('should display API Keys section', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('text=API Keys')).toBeVisible();
    await expect(page.locator('label:has-text("CoinMarketCap API Key")')).toBeVisible();
    await expect(page.locator('label:has-text("OpenSea API Key")')).toBeVisible();
  });

  test('should display Monitoring Settings section', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('text=Monitoring Settings')).toBeVisible();
    await expect(page.locator('text=Crypto Monitoring')).toBeVisible();
    await expect(page.locator('text=NFT Monitoring')).toBeVisible();
  });

  test('should toggle crypto monitoring switch', async ({ page }) => {
    await page.goto('/profile');
    const cryptoSwitch = page.getByTestId('crypto-enabled-switch');
    await expect(cryptoSwitch).toBeVisible();
  });

  test('should toggle NFT monitoring switch', async ({ page }) => {
    await page.goto('/profile');
    const nftSwitch = page.getByTestId('nft-enabled-switch');
    await expect(nftSwitch).toBeVisible();
  });
});
