const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/auth');

test.describe('Authentification TrustFund', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#auth-welcome.active', { timeout: 10000 });
  });

  test('affiche l\'écran d\'accueil avec les options d\'authentification', async ({ page }) => {
    await expect(page.locator('#auth-welcome')).toBeVisible();
    await expect(page.locator('#auth-welcome button[data-auth-target="login"]')).toBeVisible();
    await expect(page.locator('#auth-welcome button[data-auth-target="signup"]')).toBeVisible();
    await expect(page.locator('#auth-welcome button[data-explore-app]')).toBeVisible();
  });

  test('connexion utilisateur avec compte démo', async ({ page }) => {
    await login(page, 'user');
    await expect(page.locator('#screen-home.active')).toBeVisible();
    await expect(page.locator('#screen-home')).toContainText('Aïssatou');
  });

  test('connexion fournisseur avec compte démo', async ({ page }) => {
    await login(page, 'provider');
    await expect(page.locator('#screen-provider.active')).toBeVisible();
    await expect(page.locator('#screen-provider')).toContainText('Baobab Équipement');
  });

  test('connexion administrateur avec double vérification', async ({ page }) => {
    await login(page, 'admin');

    // Session admise dans l'espace admin (notice "ouvrir sur ordinateur" sur mobile)
    await expect(page.locator('#authFlow')).toBeHidden();
    await expect(page.locator('#appSession')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Administration/i);
  });

  test('mode découverte sans compte', async ({ page }) => {
    await page.click('#auth-welcome button[data-explore-app]');

    // L'invite demarre sur la boutique, pas le tableau de bord
    await expect(page.locator('#screen-catalog.active')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#guestBanner')).toContainText('Mode découverte');
  });

  test('validation du formulaire de connexion', async ({ page }) => {
    await page.click('#auth-welcome button[data-auth-target="login"]');
    await expect(page.locator('#loginPhone')).toHaveAttribute('required', '');
    await expect(page.locator('#loginPassword')).toHaveAttribute('required', '');
  });

  test('gestion des erreurs d\'authentification', async ({ page }) => {
    await page.click('#auth-welcome button[data-auth-target="login"]');
    await page.fill('#loginPhone', '77 999 99 99');
    await page.fill('#loginPassword', 'WrongPassword#123');
    await page.click('button.login-submit');
    await expect(page.locator('#loginFeedback')).toContainText(/identifiants.*incorrects/i);
  });

  test('déconnexion depuis le profil', async ({ page }) => {
    await login(page, 'user');
    await page.evaluate(() => showScreen('profile'));
    await page.click('#screen-profile .logout-button');
    await expect(page.locator('#auth-welcome')).toBeVisible();
  });
});
