import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero with tagline and CTA', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /identify any component/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /start scanning/i }),
    ).toBeVisible();
  });

  test('renders the three-step section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /three steps/i }),
    ).toBeVisible();
  });

  test('renders the feature grid', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /built for the bench/i }),
    ).toBeVisible();
  });

  test('source code link points to a github URL', async ({ page }) => {
    const link = page.getByRole('link', { name: /source code/i });
    await expect(link).toHaveAttribute('href', /github\.com/);
  });
});

test('clicking the CTA navigates toward /scan', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /start scanning/i }).click();
  // Unauthenticated → bounced to sign-in by middleware
  await expect(page).toHaveURL(/\/(auth\/sign-in|scan)/);
});