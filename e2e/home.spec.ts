import { test, expect } from '@playwright/test';

test('home page loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check that the main heading is visible
  await expect(page.getByRole('heading', { name: /zeno meeting prep/i })).toBeVisible();

  // Check that the description is visible
  await expect(page.getByText(/pre-call intelligence dashboard/i)).toBeVisible();
});
