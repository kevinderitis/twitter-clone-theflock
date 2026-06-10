import { expect, test } from '@playwright/test';

import { loginAsDemoUser } from './helpers/auth';

test('user can like and unlike a timeline tweet', async ({ page }) => {
  await loginAsDemoUser(page);

  const tweet = page.locator('[data-testid^="timeline-tweet-"]').first();
  await expect(tweet).toBeVisible();

  const likeButton = tweet.locator('[data-testid^="timeline-like-button-"]');
  const likeCount = tweet.locator('[data-testid^="timeline-like-count-"]');

  const initialCount = Number((await likeCount.textContent())?.trim() ?? '0');
  const initialLabel = (await likeButton.textContent())?.trim() ?? '';

  if (/unlike/i.test(initialLabel)) {
    await likeButton.click();
    await expect(likeButton).toHaveText(/like/i);
    await expect(likeCount).toHaveText(String(Math.max(0, initialCount - 1)));

    await likeButton.click();
    await expect(likeButton).toHaveText(/unlike/i);
    await expect(likeCount).toHaveText(String(initialCount));
    return;
  }

  await likeButton.click();
  await expect(likeButton).toHaveText(/unlike/i);
  await expect(likeCount).toHaveText(String(initialCount + 1));

  await likeButton.click();
  await expect(likeButton).toHaveText(/like/i);
  await expect(likeCount).toHaveText(String(initialCount));
});

test('user can open the followers page from a profile', async ({ page }) => {
  await loginAsDemoUser(page);

  await page.goto('/profile/demo');
  await page.getByTestId('profile-followers-link').click();

  await expect(page).toHaveURL(/\/profile\/demo\/followers$/);
  await expect(page.getByTestId('follow-list-page-followers')).toBeVisible();
  await expect(
    page.getByTestId('follow-list-results-followers'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid^="follow-list-user-"]').first(),
  ).toBeVisible();
});

test('user can open the following page from a profile', async ({ page }) => {
  await loginAsDemoUser(page);

  await page.goto('/profile/demo');
  await page.getByTestId('profile-following-link').click();

  await expect(page).toHaveURL(/\/profile\/demo\/following$/);
  await expect(page.getByTestId('follow-list-page-following')).toBeVisible();
  await expect(
    page.getByTestId('follow-list-results-following'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid^="follow-list-user-"]').first(),
  ).toBeVisible();
});
