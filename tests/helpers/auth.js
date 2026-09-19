const { expect } = require('@playwright/test');
const accounts = require('./demo-accounts');

/**
 * Helper d'authentification pour les tests TrustFund
 */
async function login(page, role = 'user') {
  const account = accounts[role];

  // Aller à la page de connexion
  await page.goto('/');

  // Attendre que l'écran d'accueil soit visible
  await page.waitForSelector('#auth-welcome', { timeout: 10000 });

  // Cliquer sur le bouton pour ouvrir les comptes de démo
  const demoToggle = page.locator('#demoToggle, button.demo-login');

  // Si on est sur l'écran d'accueil, aller vers login
  const isWelcome = await page.locator('#auth-welcome.active').isVisible({ timeout: 1000 }).catch(() => false);
  if (isWelcome) {
    await page.click('button[data-auth-target="login"]');
    await page.waitForSelector('#auth-login.active', { timeout: 5000 });
  }

  // Ouvrir le panneau des comptes de démo
  if (await demoToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await demoToggle.click();
    await page.waitForTimeout(500);
  }

  // Cliquer sur le compte de démo correspondant (remplit le formulaire)
  const demoButton = page.locator(`button[data-demo-role="${role}"]`);
  await demoButton.click();

  // Soumettre le formulaire de connexion (le bouton est hors du <form>, relie par attribut form)
  await page.click('button.login-submit[type="submit"]');

  // Le compte administrateur exige un code OTP a six chiffres
  if (role === 'admin') {
    const otpInputs = page.locator('#verifyForm .otp-fields input');
    await otpInputs.first().waitFor({ timeout: 5000 });
    const code = '123456';
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(code[i]);
    }
    await page.click('#verifyForm button[type="submit"], .verify-screen button.main-button');
  }

  // Attendre que la connexion soit effective (disparition du flux d'auth)
  await page.waitForFunction(() => {
    const authFlow = document.querySelector('#authFlow, .auth-flow');
    return authFlow && (authFlow.classList.contains('hidden') || authFlow.style.display === 'none');
  }, { timeout: 10000 });

  return account;
}

// PNG 1x1 valide : le validateur d'app.js controle le MIME, pas le contenu.
const tinyPng = () => Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

/**
 * Compléter la vérification KYC (formulaire reel du panneau #kycSheet)
 */
async function completeKYC(page) {
  await expect(page.locator('#kycSheet')).toBeVisible({ timeout: 5000 });

  await page.selectOption('#kycDocumentType', 'cni');
  await page.fill('#kycDocumentNumber', '1234567890123');

  await page.setInputFiles('#kycFront', { name: 'recto.png', mimeType: 'image/png', buffer: tinyPng() });
  await page.setInputFiles('#kycBack', { name: 'verso.png', mimeType: 'image/png', buffer: tinyPng() });

  const otpInputs = page.locator('#kycSheet .kyc-otp-fields input');
  const code = '123456';
  for (let i = 0; i < 6; i++) {
    await otpInputs.nth(i).fill(code[i]);
  }

  await page.click('#kycForm button[type="submit"]');

  // Panneau ferme et l'operation en attente reprend
  await expect(page.locator('#kycSheet')).toBeHidden({ timeout: 5000 });
}

/**
 * Naviguer vers un écran spécifique
 */
async function navigateTo(page, screenName) {
  await page.evaluate((screen) => {
    if (typeof window.showScreen === 'function') {
      window.showScreen(screen);
    }
  }, screenName);

  await expect(page.locator(`#screen-${screenName}.active`)).toBeVisible();
}

module.exports = {
  login,
  completeKYC,
  navigateTo,
  tinyPng,
  accounts
};
