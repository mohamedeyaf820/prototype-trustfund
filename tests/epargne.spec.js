const { test, expect } = require('@playwright/test');
const { login, completeKYC, tinyPng } = require('./helpers/auth');

const toast = (page, title) => page.locator('#toastZone .toast').filter({ hasText: title });

// Ouvrir le panneau de paiement apres la verification KYC requise
async function openPaymentSheet(page) {
  await page.locator('[data-free-payment]').first().click();
  await expect(page.locator('#kycSheet')).toBeVisible({ timeout: 5000 });
  await completeKYC(page);
  await expect(page.locator('#paymentSheet')).toBeVisible({ timeout: 5000 });
}

test.describe('Parcours Épargne Utilisateur', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page, 'user');
  });

  test('consultation du tableau de bord épargne', async ({ page }) => {
    await expect(page.locator('#screen-home.active')).toBeVisible();

    await expect(page.locator('#totalSaved')).toBeVisible();
    await expect(page.locator('#screen-home')).toContainText(/Total épargné/i);
    await expect(page.locator('#freeSavingsBalance')).toBeVisible();
    await expect(page.locator('#screen-home')).toContainText(/Épargne disponible/i);
  });

  test('création d\'un objectif d\'épargne avec KYC', async ({ page }) => {
    await page.evaluate(() => { state.goalCount = 2; });
    await page.locator('[data-open="goalSheet"]').first().click();

    await completeKYC(page);
    await expect(page.locator('#goalSheet')).toBeVisible();

    await page.fill('#goalName', 'iPhone 15 Pro');
    await page.fill('#goalAmount', '650000');
    await page.click('#goalNext');

    await expect(page.locator('.goal-step[data-step="2"]')).toBeVisible();
    await page.click('#goalCreate');

    await expect(toast(page, 'Objectif créé')).toBeVisible();
    await expect(page.locator('#screen-goals.active')).toBeVisible();
  });

  test('respect de la limite de 3 objectifs actifs', async ({ page }) => {
    // goalCount demarre a 3 : la creation est bloquee avant meme la porte KYC
    await page.locator('[data-open="goalSheet"]').first().click();

    await expect(toast(page, 'Limite de 3 objectifs atteinte')).toBeVisible();
    await expect(page.locator('#goalSheet')).toBeHidden();
    await expect(page.locator('#kycSheet')).toBeHidden();
  });

  test('cotisation vers un objectif existant', async ({ page }) => {
    await openPaymentSheet(page);

    await page.selectOption('#paymentGoal', { label: 'Ordinateur portable' });
    await page.click('#paymentSheet .amount-choices [data-amount="25000"]');
    await expect(page.locator('#paymentAmount')).toHaveValue('25000');
    await page.check('#paymentConsent');
    await page.click('#paymentForm button[type="submit"]');

    await expect(toast(page, 'Paiement confirmé')).toBeVisible();
    await expect(page.locator('#screen-activity.active')).toBeVisible();
    await expect(page.locator('#activityStack .activity-card').first()).toContainText('25 000');
  });

  test('rejet d\'un montant supérieur au reste à financer', async ({ page }) => {
    await openPaymentSheet(page);

    await page.selectOption('#paymentGoal', { label: 'Ordinateur portable' });
    // Reste a financer : 600 000 - 372 000 = 228 000
    await page.fill('#paymentAmount', '300000');
    await page.check('#paymentConsent');
    await page.click('#paymentForm button[type="submit"]');

    await expect(toast(page, 'Montant trop élevé')).toBeVisible();
    await expect(page.locator('#paymentSheet')).toBeVisible();
  });

  test('déclaration de cotisation externe avec preuve', async ({ page }) => {
    await openPaymentSheet(page);

    await page.click('#showProofForm');
    await expect(page.locator('#contributionSheet')).toBeVisible();

    await page.fill('#contributionRef', 'OM-TEST-4567');
    await page.setInputFiles('#proofFile', { name: 'preuve.png', mimeType: 'image/png', buffer: tinyPng() });
    await page.click('#contributionForm button[type="submit"]');

    await expect(toast(page, 'Déclaration reçue')).toBeVisible();
    await expect(page.locator('#screen-activity.active')).toBeVisible();
  });

  test('détection de doublon de référence externe', async ({ page }) => {
    await page.evaluate(() => { state.usedReferences.add('OM-TEST-4567'); });
    await openPaymentSheet(page);

    await page.click('#showProofForm');
    await expect(page.locator('#contributionSheet')).toBeVisible();

    // Saisie en minuscules : la comparaison se fait normalisee
    await page.fill('#contributionRef', 'om-test-4567');
    await page.setInputFiles('#proofFile', { name: 'preuve.png', mimeType: 'image/png', buffer: tinyPng() });
    await page.click('#contributionForm button[type="submit"]');

    await expect(toast(page, 'Référence déjà utilisée')).toBeVisible();
    await expect(page.locator('#contributionSheet')).toBeVisible();
  });
});
