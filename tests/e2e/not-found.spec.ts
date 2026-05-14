import { test, expect } from '@playwright/test';

test('custom 404 renders for unknown routes', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  await expect(
    page.getByRole('heading', { name: /page not found/i }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /back home/i })).toBeVisible();
});