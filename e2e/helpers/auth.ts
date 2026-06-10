import { expect, type Page } from '@playwright/test';

export const demoCredentials = {
  email: 'demo@example.com',
  password: 'Password123!',
};

export const loginAsDemoUser = async (page: Page) => {
  await page.goto('/login');
  await expect(page.getByTestId('login-page')).toBeVisible();

  await page.getByLabel('Email').fill(demoCredentials.email);
  await page.getByLabel('Password').fill(demoCredentials.password);
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('timeline-page')).toBeVisible();
};

export const logoutFromSidebar = async (page: Page) => {
  await page.getByTestId('sidebar-logout').click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId('login-page')).toBeVisible();
};
