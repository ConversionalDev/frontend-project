import { test, expect } from '@playwright/test';

test('the app loads and shows the audio player', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open track →' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'Lyrics' })).toBeVisible();
});

test('pressing Enter stamps the focused line with a timecode', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open track →' }).click();
  await expect(page.getByRole('listbox', { name: 'Lyrics' })).toBeVisible();

  // The first line is focused by default. Audio is at t=0 (not yet played),
  // so the stamp lands at 0ms. No button is focused, so Enter reaches our handler.
  await page.keyboard.press('Enter');

  // The first lyric row should now show a timecode badge (00:00.xx)
  // instead of the untimed dash.
  await expect(page.getByRole('option').first()).toContainText('00:00');
});
