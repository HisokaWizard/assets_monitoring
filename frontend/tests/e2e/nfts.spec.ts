import { test, expect } from '@playwright/test';

test.describe('NFTs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/home');
  });

  test.describe('NFT Table columns', () => {
    test('should display Floor Price USD column header', async ({ page }) => {
      await page.goto('/nfts');
      await expect(page.locator('text=Floor Price USD')).toBeVisible();
    });

    test('should display Avg Price USD column header', async ({ page }) => {
      await page.goto('/nfts');
      await expect(page.locator('text=Avg Price USD')).toBeVisible();
    });

    test('should display Floor Price column header', async ({ page }) => {
      await page.goto('/nfts');
      await expect(page.locator('text=Floor Price').first()).toBeVisible();
    });

    test('should display Avg Price column header', async ({ page }) => {
      await page.goto('/nfts');
      await expect(page.locator('text=Avg Price').first()).toBeVisible();
    });
  });

  test.describe('Add NFT form', () => {
    test('should show Native Token field when opening Add dialog', async ({ page }) => {
      await page.goto('/nfts');
      await page.click('button:has-text("Add NFT")');
      await expect(page.locator('label:has-text("Native Token")')).toBeVisible();
    });

    test('should have ETH as default value for Native Token', async ({ page }) => {
      await page.goto('/nfts');
      await page.click('button:has-text("Add NFT")');
      const nativeTokenInput = page.locator('input[value="ETH"]');
      await expect(nativeTokenInput).toBeVisible();
    });

    test('should show helper text for Native Token field', async ({ page }) => {
      await page.goto('/nfts');
      await page.click('button:has-text("Add NFT")');
      await expect(page.locator('text=Token symbol the collection trades in')).toBeVisible();
    });

    test('should show Collection Name field when adding', async ({ page }) => {
      await page.goto('/nfts');
      await page.click('button:has-text("Add NFT")');
      await expect(page.locator('label:has-text("Collection Name")')).toBeVisible();
    });

    test('should convert Native Token input to uppercase', async ({ page }) => {
      await page.goto('/nfts');
      await page.click('button:has-text("Add NFT")');
      const nativeTokenField = page.locator('label:has-text("Native Token") + div input, input[placeholder="e.g., ETH"]').first();
      await nativeTokenField.clear();
      await nativeTokenField.fill('sol');
      const value = await nativeTokenField.inputValue();
      expect(value).toBe('SOL');
    });

    test('should show Average Purchase Price with native token label', async ({ page }) => {
      await page.goto('/nfts');
      await page.click('button:has-text("Add NFT")');
      await expect(page.locator('text=Average Purchase Price')).toBeVisible();
    });

    test('should show helper text for Average Purchase Price', async ({ page }) => {
      await page.goto('/nfts');
      await page.click('button:has-text("Add NFT")');
      await expect(page.locator('text=Enter price in').first()).toBeVisible();
    });
  });
});
