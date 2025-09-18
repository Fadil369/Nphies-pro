import { test, expect } from '@playwright/test';

const selectors = {
  tenantLink: '[data-testid="tenant-link"]',
  quickActionSubmit: '[data-testid="quick-action-submit"]',
};

test('dashboard navigation and analytics widgets', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Heading renders in Arabic (default locale)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('براين سايت');

  // Analytics widgets are visible
  await expect(page.getByText(/Status Trends|اتجاهات الحالات/)).toBeVisible();
  await expect(page.getByText(/Top Tenants|أفضل الجهات/)).toBeVisible();

  // Quick action button should be enabled for provider_biller mock session
  await expect(page.locator(selectors.quickActionSubmit)).toBeEnabled();

  // Navigate to tenant profile and back
  const firstTenant = page.locator(selectors.tenantLink).first();
  const tenantName = (await firstTenant.textContent())?.trim() ?? '';
  await firstTenant.click();

  await expect(page).toHaveURL(/\/tenants\//);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(tenantName);

  await page.getByRole('link', { name: /Back to dashboard|العودة للوحة التحكم/ }).click();
  await expect(page).toHaveURL('/');

  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
});
