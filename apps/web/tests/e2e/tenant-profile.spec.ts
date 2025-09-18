import { test, expect } from '@playwright/test';

const selectors = {
  tenantLink: '[data-testid="tenant-link"]',
  claimCard: '[data-testid="claim-card"]',
  timelineButton: '[data-testid="view-timeline"]',
  timelineNoteInput: '[data-testid="timeline-note-input"]',
  timelineNoteSubmit: '[data-testid="timeline-note-submit"]',
};

test('tenant profile renders metrics and timeline', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const firstTenantLink = page.locator(selectors.tenantLink).first();
  await expect(firstTenantLink).toBeVisible();
  const tenantName = (await firstTenantLink.textContent())?.trim() ?? '';
  await firstTenantLink.click();

  await expect(page).toHaveURL(/\/tenants\//);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(tenantName);
  await expect(page.getByText(/إجمالي المطالبات|Total claims/)).toBeVisible();
  await expect(page.getByText(/أحدث المطالبات|Recent Claims/)).toBeVisible();

  const firstClaimCard = page.locator(selectors.claimCard).first();
  if (await firstClaimCard.isVisible()) {
    const timelineButton = firstClaimCard.locator(selectors.timelineButton).first();
    if (await timelineButton.isVisible()) {
      await timelineButton.click();
      await expect(page.getByText(/Claim Timeline|سجل المطالبة/)).toBeVisible();
      if (await page.locator(selectors.timelineNoteInput).isVisible()) {
        await page.locator(selectors.timelineNoteInput).fill('Tenant QA note');
        await Promise.all([
          page.waitForResponse((response) => response.url().includes('/api/claims') && response.request().method() === 'POST' && response.ok()),
          page.locator(selectors.timelineNoteSubmit).click(),
        ]);
        await expect(page.getByText(/Tenant QA note/)).toBeVisible();
      }
      await page.getByRole('button', { name: /Close|إغلاق/ }).click();
    }
  }

  await page.getByRole('link', { name: /Back to dashboard|العودة للوحة التحكم/ }).click();
  await expect(page).toHaveURL('/');
});
