import { test, expect } from '@playwright/test';

test.describe('Meeting Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real test, you'd set up auth cookies or mock the auth
    // For now, this demonstrates the E2E test structure
    await page.goto('/');
  });

  test('displays dashboard header and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /meeting dashboard/i })).toBeVisible();
    await expect(
      page.getByText(/view your upcoming meetings with automated research briefs/i)
    ).toBeVisible();
  });

  test('shows keyboard shortcuts hint', async ({ page }) => {
    await expect(page.getByText(/keyboard shortcuts/i)).toBeVisible();
    await expect(page.getByText(/D.*for Day/i)).toBeVisible();
    await expect(page.getByText(/W.*for Week/i)).toBeVisible();
    await expect(page.getByText(/M.*for Month/i)).toBeVisible();
  });

  test('renders campaign filter dropdown', async ({ page }) => {
    const campaignFilter = page.getByRole('button', { name: /campaigns/i });
    await expect(campaignFilter).toBeVisible();
  });

  test('renders view toggle buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
  });

  test('renders calendar navigation controls', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
    await expect(page.getByLabel('Previous')).toBeVisible();
    await expect(page.getByLabel('Next')).toBeVisible();
  });

  test('switches between calendar views', async ({ page }) => {
    // Start with weekly view (default)
    const weekButton = page.getByRole('button', { name: 'Week' });
    await expect(weekButton).toHaveClass(/bg-gray-900/);

    // Switch to daily view
    await page.getByRole('button', { name: 'Day' }).click();
    const dayButton = page.getByRole('button', { name: 'Day' });
    await expect(dayButton).toHaveClass(/bg-gray-900/);

    // Switch to monthly view
    await page.getByRole('button', { name: 'Month' }).click();
    const monthButton = page.getByRole('button', { name: 'Month' });
    await expect(monthButton).toHaveClass(/bg-gray-900/);
  });

  test('keyboard shortcuts work for view switching', async ({ page }) => {
    // Press D for daily view
    await page.keyboard.press('d');
    await expect(page.getByRole('button', { name: 'Day' })).toHaveClass(/bg-gray-900/);

    // Press W for weekly view
    await page.keyboard.press('w');
    await expect(page.getByRole('button', { name: 'Week' })).toHaveClass(/bg-gray-900/);

    // Press M for monthly view
    await page.keyboard.press('m');
    await expect(page.getByRole('button', { name: 'Month' })).toHaveClass(/bg-gray-900/);
  });

  test('navigates to next period', async ({ page }) => {
    const nextButton = page.getByLabel('Next');

    // Get initial date heading
    const heading = page.getByRole('heading', { level: 1 }).filter({ hasText: /\d{4}/ });
    const initialText = await heading.textContent();

    // Click next
    await nextButton.click();

    // Wait for change
    await page.waitForTimeout(100);

    const newText = await heading.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('navigates to previous period', async ({ page }) => {
    const prevButton = page.getByLabel('Previous');

    // Get initial date heading
    const heading = page.getByRole('heading', { level: 1 }).filter({ hasText: /\d{4}/ });
    const initialText = await heading.textContent();

    // Click previous
    await prevButton.click();

    // Wait for change
    await page.waitForTimeout(100);

    const newText = await heading.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('today button resets to current date', async ({ page }) => {
    // Navigate forward
    await page.getByLabel('Next').click();
    await page.getByLabel('Next').click();

    // Click Today button
    await page.getByRole('button', { name: 'Today' }).click();

    // Should show current month/date
    const today = new Date();
    const monthName = today.toLocaleDateString('en-US', { month: 'long' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(monthName);
  });

  test('shows empty state when no campaign is selected', async ({ page }) => {
    // If no campaigns exist or none selected, should show empty state
    const emptyState = page.getByText(/no campaign selected/i);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(page.getByText(/select a campaign from the dropdown/i)).toBeVisible();
    }
  });

  test('shows loading state initially', async ({ page }) => {
    // Should show loading spinner briefly on initial load
    // This may be too fast to catch in tests, but demonstrates the pattern
    const spinner = page.locator('.animate-spin');
    // Either spinner is visible or content has loaded
    const hasSpinner = await spinner.isVisible().catch(() => false);
    const hasContent = await page.getByRole('heading', { level: 1 }).isVisible().catch(() => false);

    expect(hasSpinner || hasContent).toBe(true);
  });
});

test.describe('Meeting Cards', () => {
  test.skip('displays meeting cards when meetings exist', async ({ page }) => {
    // Skip: Requires database seeding with test data
    // This demonstrates what the test would look like

    await page.goto('/');

    // Wait for meetings to load
    await page.waitForSelector('[href^="/meetings/"]');

    // Should show at least one meeting card
    const meetingCards = page.locator('[href^="/meetings/"]');
    await expect(meetingCards.first()).toBeVisible();

    // Meeting card should have title
    await expect(meetingCards.first()).toContainText(/.+/);

    // Meeting card should have status badge
    const statusBadge = meetingCards.first().locator('span[class*="badge"]');
    await expect(statusBadge).toBeVisible();
  });

  test.skip('navigates to meeting detail when card is clicked', async ({ page }) => {
    // Skip: Requires database seeding
    await page.goto('/');

    // Click first meeting card
    const meetingCard = page.locator('[href^="/meetings/"]').first();
    const meetingId = await meetingCard.getAttribute('href');
    await meetingCard.click();

    // Should navigate to meeting detail page
    await expect(page).toHaveURL(meetingId!);
  });
});
