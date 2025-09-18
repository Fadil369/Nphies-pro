import { test, expect } from '@playwright/test';

const selectors = {
  quickActionSubmit: '[data-testid="quick-action-submit"]',
  tenantSelect: '[data-testid="claim-tenant"]',
  patientName: '[data-testid="claim-patient-name"]',
  patientId: '[data-testid="claim-patient-id"]',
  nationalId: '[data-testid="claim-national-id"]',
  amount: '[data-testid="claim-amount"]',
  diagnosis: '[data-testid="claim-diagnosis"]',
  submit: '[data-testid="claim-submit"]',
  claimCard: '[data-testid="claim-card"]',
  statusApproved: '[data-testid="status-approved"]',
  timelineButton: '[data-testid="view-timeline"]',
  timelineNoteInput: '[data-testid="timeline-note-input"]',
  timelineNoteSubmit: '[data-testid="timeline-note-submit"]',
};

test('submits a new claim, approves it, and views timeline', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(page.locator(selectors.quickActionSubmit)).toBeEnabled();
  await page.locator(selectors.quickActionSubmit).click();

  const modalTenantSelect = page.locator(selectors.tenantSelect);
  await expect(modalTenantSelect).toBeVisible();

  const options = await modalTenantSelect.locator('option[value]')
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value).filter(Boolean));
  const optionToSelect = options[1] ?? options[0];
  await modalTenantSelect.selectOption(optionToSelect);

  const uniqueSuffix = Date.now();
  await page.locator(selectors.patientName).fill(`Playwright Patient ${uniqueSuffix}`);
  await page.locator(selectors.patientId).fill(`PW-${uniqueSuffix}`);
  await page.locator(selectors.nationalId).fill('1234567890');
  await page.locator(selectors.amount).fill('1234');
  await page.locator(selectors.diagnosis).fill('Automated test claim');

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/claims') && response.request().method() === 'POST' && response.ok()),
    page.locator(selectors.submit).click(),
  ]);

  const newClaimCard = page.locator(selectors.claimCard).filter({ hasText: `Playwright Patient ${uniqueSuffix}` }).first();
  await expect(newClaimCard).toBeVisible();

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/claims') && response.request().method() === 'PATCH' && response.ok()),
    newClaimCard.locator(selectors.statusApproved).click(),
  ]);
  await expect(newClaimCard).toContainText(/Approved|معتمدة/);

  await newClaimCard.locator(selectors.timelineButton).click();
  await expect(page.getByText(/Claim Timeline|سجل المطالبة/)).toBeVisible();
  if (await page.locator(selectors.timelineNoteInput).isVisible()) {
    await page.locator(selectors.timelineNoteInput).fill('Automated QA note');
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/claims') && response.request().method() === 'POST' && response.ok()),
      page.locator(selectors.timelineNoteSubmit).click(),
    ]);
    await expect(page.getByText(/Automated QA note/)).toBeVisible();
  }
  await page.getByRole('button', { name: /Close|إغلاق/ }).click();

  await page.screenshot({ path: 'test-results/claims-flow.png', fullPage: true });
});
