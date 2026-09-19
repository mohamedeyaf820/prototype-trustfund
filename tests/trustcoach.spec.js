const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/auth');

test.describe('TrustCoach Conversationnel', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page, 'user');
  });

  test('ouverture de TrustCoach depuis le bouton flottant', async ({ page }) => {
    await page.click('#trustCoachFab');
    await expect(page.locator('#screen-ai-coach.active')).toBeVisible();
    await expect(page.locator('#coachChat .coach-message')).not.toHaveCount(0);
  });

  test('envoi d\'un message et reponse du coach', async ({ page }) => {
    await page.click('#trustCoachFab');
    await page.fill('#coachInput', 'Je veux économiser pour un ordinateur');
    await page.click('.coach-form button[type="submit"]');

    await expect(page.locator('#coachChat .coach-message.user')).toHaveCount(1);
    await expect(page.locator('#coachChat .coach-message.ai')).toHaveCount(3, { timeout: 3000 });
  });

  test('reponse adaptee au budget hebdomadaire', async ({ page }) => {
    await page.click('#trustCoachFab');
    await page.fill('#coachInput', 'Je peux économiser 5 000 FCFA par semaine');
    await page.click('.coach-form button[type="submit"]');

    const last = page.locator('#coachChat .coach-message.ai').last();
    await expect(last).toContainText(/20 000|par mois/i, { timeout: 3000 });
  });

  test('les suggestions rapides envoient leur question', async ({ page }) => {
    await page.click('#trustCoachFab');
    await page.click('.coach-suggestions button >> nth=0');
    await expect(page.locator('#coachChat .coach-message.user')).toHaveCount(1);
    await expect(page.locator('#coachChat .coach-message.ai')).toHaveCount(3, { timeout: 3000 });
  });

  test('retour vers l\'accueil depuis le coach', async ({ page }) => {
    await page.click('#trustCoachFab');
    await page.click('#screen-ai-coach .coach-header > button');
    await expect(page.locator('#screen-home.active')).toBeVisible();
  });
});
