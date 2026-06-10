import { expect, test } from '@playwright/test';

import { loginAsDemoUser, logoutFromSidebar } from './helpers/auth';

test('user can log in and log out successfully', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByTestId('login-page')).toBeVisible();

  await loginAsDemoUser(page);
  await expect(page.getByTestId('timeline-feed')).toBeVisible();

  await logoutFromSidebar(page);
});

test('authenticated user can see timeline tweets from seed data', async ({
  page,
}) => {
  await loginAsDemoUser(page);

  await expect(page.getByTestId('timeline-feed')).toBeVisible();
  await expect(
    page.locator('[data-testid^="timeline-tweet-"]').first(),
  ).toBeVisible();
});

test('user can create a tweet and later see it on their profile', async ({
  page,
}) => {
  const tweetContent = `Playwright post ${Date.now()}`;

  await loginAsDemoUser(page);
  await page.getByTestId('tweet-composer-input').fill(tweetContent);
  await page.getByTestId('tweet-composer-submit').click();

  await expect(page.getByTestId('tweet-composer-success')).toHaveText(
    'Tweet posted.',
  );
  await expect(page.getByTestId('tweet-composer-input')).toHaveValue('');

  await page.goto('/profile/demo');
  await expect(page.getByTestId('profile-page')).toBeVisible();
  await expect(page.getByTestId('profile-tweets')).toContainText(tweetContent);
});

test('user can search for another user and open their profile', async ({
  page,
}) => {
  await loginAsDemoUser(page);

  await page.goto('/search');
  await page.getByTestId('search-input').fill('barbara');

  const resultCard = page.getByTestId('search-result-barbara');
  await expect(resultCard).toBeVisible();
  await resultCard.getByTestId('search-result-barbara-link').click();

  await expect(page).toHaveURL(/\/profile\/barbara$/);
  await expect(page.getByTestId('profile-summary')).toContainText(
    'Barbara Liskov',
  );
  await expect(
    page.locator('[data-testid^="profile-tweet-"]').first(),
  ).toBeVisible();
});

test('user can follow and unfollow another user from the profile page', async ({
  page,
}) => {
  await loginAsDemoUser(page);

  await page.goto('/profile/barbara');
  await expect(page.getByTestId('profile-page')).toBeVisible();
  await expect(page.getByTestId('profile-summary')).toContainText(
    'Barbara Liskov',
  );

  const followToggle = page.getByTestId('profile-follow-toggle');
  await expect(followToggle).toBeVisible();

  const initialLabel = (await followToggle.textContent())?.trim() ?? '';

  if (/unfollow/i.test(initialLabel)) {
    await followToggle.click();
    await expect(followToggle).toHaveText(/follow/i);
  }

  await followToggle.click();
  await expect(followToggle).toHaveText(/unfollow/i);

  await followToggle.click();
  await expect(followToggle).toHaveText(/follow/i);
});
