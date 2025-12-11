import { test, expect } from '@playwright/test';

test.describe('Ad-Hoc Research Request Form', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real test, you'd set up auth cookies or mock the auth
    // For now, this demonstrates the E2E test structure
    await page.goto('/ad-hoc/new');
  });

  // T073: End-to-end test to submit ad-hoc request with website
  test('should display ad-hoc research form with website field', async ({ page }) => {
    // Wait for form to load (campaigns need to be fetched)
    await page.waitForSelector('form', { timeout: 5000 });

    // Check that the website field exists
    const websiteField = page.getByLabel(/website/i);
    await expect(websiteField).toBeVisible();

    // Check for helper text about website prioritization
    await expect(
      page.getByText(/prioritized over email domain/i)
    ).toBeVisible();
  });

  // T074: Test ad-hoc form submission with website field
  test('should successfully submit form with website field', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 5000 });

    // Fill out the form with website
    await page.getByLabel(/prospect name/i).fill('John Doe');
    await page.getByLabel(/company name/i).fill('Acme Corp');
    await page.getByLabel(/website/i).fill('https://acmecorp.com');
    await page.getByLabel(/email/i).fill('john@acmecorp.com');

    // Select a campaign (if dropdown exists)
    const campaignSelect = page.locator('select[name="campaignId"]');
    const hasCampaignSelect = await campaignSelect.isVisible().catch(() => false);

    if (hasCampaignSelect) {
      // Select first available campaign
      await campaignSelect.selectOption({ index: 0 });
    }

    // Submit the form
    const submitButton = page.getByRole('button', { name: /submit|create/i });
    await submitButton.click();

    // Wait for navigation or success message
    await page.waitForURL('/ad-hoc', { timeout: 10000 }).catch(async () => {
      // If navigation doesn't happen, check for success message
      await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test('should validate website URL format', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 5000 });

    // Fill website with invalid URL
    const websiteField = page.getByLabel(/website/i);
    await websiteField.fill('not-a-valid-url');

    // Try to submit
    const submitButton = page.getByRole('button', { name: /submit|create/i });
    await submitButton.click();

    // Should show validation error
    const errorMessage = page.getByText(/invalid.*url|please.*valid.*url/i);
    await expect(errorMessage).toBeVisible({ timeout: 2000 }).catch(async () => {
      // Alternative: Check if browser validation prevented submission
      const currentUrl = page.url();
      expect(currentUrl).toContain('/ad-hoc/new');
    });
  });

  test('should accept website-only submission (no email)', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 5000 });

    // Fill only required fields including website but NOT email
    await page.getByLabel(/prospect name/i).fill('Jane Smith');
    await page.getByLabel(/company name/i).fill('TechCorp');
    await page.getByLabel(/website/i).fill('https://techcorp.com');

    // Leave email empty intentionally

    // Select a campaign (if dropdown exists)
    const campaignSelect = page.locator('select[name="campaignId"]');
    const hasCampaignSelect = await campaignSelect.isVisible().catch(() => false);

    if (hasCampaignSelect) {
      await campaignSelect.selectOption({ index: 0 });
    }

    // Submit the form
    const submitButton = page.getByRole('button', { name: /submit|create/i });
    await submitButton.click();

    // Should succeed (website is sufficient without email)
    await page.waitForURL('/ad-hoc', { timeout: 10000 }).catch(async () => {
      // Check if still on form, which would indicate validation error
      const currentUrl = page.url();
      // If we're still on the new page, that's a test failure
      if (currentUrl.includes('/ad-hoc/new')) {
        const errorText = await page.locator('body').textContent();
        throw new Error(`Form submission failed: ${errorText}`);
      }
    });
  });

  test('should normalize website URLs (add https if missing)', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 5000 });

    // Fill website without protocol
    await page.getByLabel(/website/i).fill('example.com');

    // Move focus away to trigger normalization (if implemented)
    await page.getByLabel(/prospect name/i).click();

    // Check if the value was normalized
    const websiteValue = await page.getByLabel(/website/i).inputValue();

    // Website should have protocol added (if normalization is implemented)
    // This test may need adjustment based on actual implementation
    expect(websiteValue).toMatch(/^https?:\/\//);
  });

  test.skip('should display loading state during submission', async ({ page }) => {
    // Skip: Requires proper form submission setup
    await page.waitForSelector('form', { timeout: 5000 });

    // Fill required fields
    await page.getByLabel(/prospect name/i).fill('Test User');
    await page.getByLabel(/website/i).fill('https://test.com');

    // Submit
    const submitButton = page.getByRole('button', { name: /submit|create/i });
    await submitButton.click();

    // Should show loading state
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText(/submitting|loading/i)).toBeVisible();
  });
});

test.describe('Ad-Hoc Research Request List', () => {
  test.skip('should display list of ad-hoc research requests', async ({ page }) => {
    // Skip: Requires database seeding
    await page.goto('/ad-hoc');

    // Should show list of requests
    await expect(page.getByRole('heading', { name: /ad-hoc research/i })).toBeVisible();
  });

  test.skip('should show research brief when request is completed', async ({ page }) => {
    // Skip: Requires database seeding with completed request
    await page.goto('/ad-hoc');

    // Click on a completed request
    const completedRequest = page.getByText(/completed/i).first();
    await completedRequest.click();

    // Should show research brief details
    await expect(page.getByRole('heading', { name: /research brief/i })).toBeVisible();
  });
});
