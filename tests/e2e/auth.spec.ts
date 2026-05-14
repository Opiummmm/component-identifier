import { test, expect } from '@playwright/test';

test.describe('Sign-in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-in');
  });

  test('renders Google button + email form + segmented toggle', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /continue with google/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/you@example/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^sign in$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^sign up$/i }),
    ).toBeVisible();
  });

  test('email submit button is disabled until both fields are filled', async ({
    page,
  }) => {
    const submit = page.getByRole('button', { name: /^sign in$/i }).last();
    await expect(submit).toBeDisabled();

    await page.getByPlaceholder(/you@example/i).fill('test@example.com');
    await page.getByPlaceholder(/^password$/i).fill('secret123');

    await expect(submit).toBeEnabled();
  });

  test('toggling to sign-up updates the submit button label', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /^sign up$/i }).click();
    await expect(
      page.getByRole('button', { name: /create account/i }),
    ).toBeVisible();
  });

  test('Escape key closes back to home', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL('/');
  });

  test('close button navigates home', async ({ page }) => {
    await page.getByRole('button', { name: /close and return home/i }).click();
    await expect(page).toHaveURL('/');
  });
});