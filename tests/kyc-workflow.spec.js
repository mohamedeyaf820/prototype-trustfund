const { test, expect } = require('@playwright/test');
const { login, completeKYC } = require('./helpers/auth');

// Declenche la verification via une operation sensible (depot libre depuis l'accueil)
async function triggerKyc(page) {
  await page.locator('[data-free-payment]').first().click();
  await expect(page.locator('#kycSheet')).toBeVisible({ timeout: 5000 });
}

test.describe('Workflow KYC Différé', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page, 'user');
  });

  test('déclenchement KYC lors d\'un dépôt libre', async ({ page }) => {
    await triggerKyc(page);

    await expect(page.locator('#kycSheet h2')).toContainText(/vérifier votre identité/i);
    await expect(page.locator('#kycReason')).toContainText(/dépôt/i);
    await expect(page.locator('#kycSheet')).toBeVisible();

    // Le panneau de paiement ne doit pas etre ouvert avant la verification
    await expect(page.locator('#paymentSheet')).toBeHidden();
  });

  test('déclenchement KYC lors de création d\'objectif', async ({ page }) => {
    // liberer une place pour que la porte "limite de 3" ne bloque pas
    await page.evaluate(() => { state.goalCount = 2; });

    await page.locator('[data-open="goalSheet"]').first().click();
    await expect(page.locator('#kycSheet')).toBeVisible();

    await completeKYC(page);

    // L'action en attente reprend : le panneau objectif s'ouvre
    await expect(page.locator('#goalSheet')).toBeVisible({ timeout: 5000 });
  });

  test('complétion réussie du workflow KYC', async ({ page }) => {
    await triggerKyc(page);
    await completeKYC(page);

    // Reprise automatique de l'operation initiale
    await expect(page.locator('#paymentSheet')).toBeVisible({ timeout: 5000 });

    await page.check('#paymentConsent');
    await page.click('#paymentForm button[type="submit"]');

    await expect(page.locator('#toastZone .toast').filter({ hasText: 'Paiement confirmé' })).toBeVisible();
  });

  test('réutilisation de la vérification KYC dans la session', async ({ page }) => {
    await triggerKyc(page);
    await completeKYC(page);
    await expect(page.locator('#paymentSheet')).toBeVisible();

    // Fermer sans payer, puis retenter un depot
    await page.click('#paymentSheet button[value="cancel"]');
    await expect(page.locator('#paymentSheet')).toBeHidden();

    await page.locator('[data-free-payment]').first().click();

    // Pas de re-demande KYC : le paiement s'ouvre directement
    await expect(page.locator('#kycSheet')).toBeHidden();
    await expect(page.locator('#paymentSheet')).toBeVisible();
  });

  test('validation du formulaire KYC (CNI invalide refusée)', async ({ page }) => {
    await triggerKyc(page);

    // 13 chiffres identiques : refuse par la regle "non repetes"
    await page.fill('#kycDocumentNumber', '1111111111111');
    await page.click('#kycForm button[type="submit"]');

    await expect(page.locator('#kycSheet')).toBeVisible();
    await expect(page.locator('#kycNumberHelp')).toContainText(/13 chiffres/);
  });

  test('annulation du workflow KYC', async ({ page }) => {
    await triggerKyc(page);

    await page.click('#kycSheet [data-close="kycSheet"]');

    await expect(page.locator('#kycSheet')).toBeHidden();
    // L'operation annulee ne doit pas reprendre
    await expect(page.locator('#paymentSheet')).toBeHidden();
    await expect(page.locator('#screen-home')).toBeVisible();
  });
});
