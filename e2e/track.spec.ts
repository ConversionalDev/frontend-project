import { test, expect } from '@playwright/test';

/**
 * Proves the harness works: dev servers up, proxy wired, token accepted,
 * React rendering. Updated to click through the load screen.
 */
test('the app loads and shows the audio player', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open track →' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'Lyrics' })).toBeVisible();
});
