import { test, expect } from '@playwright/test';

/**
 * Proves the harness works: dev servers up, proxy wired, token accepted,
 * React rendering. Updated to click through the load screen.
 */
test('the app loads and shows the track title', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open track →' }).click();
  await expect(page.getByRole('heading', { name: 'You Verse You' })).toBeVisible();
});
