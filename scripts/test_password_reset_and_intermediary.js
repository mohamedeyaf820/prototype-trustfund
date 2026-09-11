const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const ROOT = 'C:\\Users\\moham\\OneDrive\\Documents\\Trustfund';
const CHROME = 'C:\\Users\\moham\\.cache\\puppeteer\\chrome\\win64-127.0.6533.88\\chrome-win64\\chrome.exe';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 920, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof openPasswordResetFlow === 'function' && typeof enterApp === 'function');

  await page.evaluate(() => showAuth('login'));
  await page.click('[data-open="passwordResetSheet"]');
  await page.type('#resetPhone', '770000001');
  await page.evaluate(() => document.getElementById('passwordResetForm').requestSubmit());
  assert(await page.$eval('[data-reset-step="2"]', element => element.classList.contains('active')), 'L’écran de saisie du code ne s’affiche pas.');

  await page.evaluate(() => {
    document.querySelectorAll('.reset-otp-fields input').forEach((input, index) => { input.value = String(index + 1); });
    document.getElementById('passwordResetForm').requestSubmit();
  });
  assert(await page.$eval('[data-reset-step="3"]', element => element.classList.contains('active')), 'L’écran du nouveau mot de passe ne s’affiche pas.');

  await page.type('#resetNewPassword', 'NouveauTrust#27');
  await page.type('#resetConfirmPassword', 'NouveauTrust#27');
  await page.evaluate(() => document.getElementById('passwordResetForm').requestSubmit());
  const resetResult = await page.evaluate(() => ({
    loginVisible: document.getElementById('auth-login').classList.contains('active'),
    feedback: document.getElementById('loginFeedback').textContent.trim(),
    phone: document.getElementById('loginPhone').value,
  }));
  assert(resetResult.loginVisible, 'La page de connexion ne revient pas après le changement du mot de passe.');
  assert(resetResult.feedback.includes('Mot de passe modifié'), 'La confirmation du changement de mot de passe est absente.');

  await page.type('#loginPassword', 'NouveauTrust#27');
  await page.evaluate(() => document.getElementById('loginForm').requestSubmit());
  assert(await page.$eval('#screen-home', element => element.classList.contains('active')), 'Le nouveau mot de passe ne permet pas la connexion.');

  await page.evaluate(() => {
    showScreen('catalog');
    openSheet('productDetailSheet');
  });
  await page.click('#contactProvider');
  await page.evaluate(() => document.getElementById('contactProviderForm').requestSubmit());
  const receivedByAdmin = await page.evaluate(() => ({
    adminCard: document.getElementById('availabilityAdminCard').classList.contains('active'),
    supplierNotified: document.getElementById('providerContactNotif').classList.contains('active'),
    recipient: document.getElementById('contactVendorName').textContent.trim(),
    status: state.availabilityRequest?.status,
  }));
  assert(receivedByAdmin.adminCard, 'La demande utilisateur n’arrive pas dans l’administration.');
  assert(!receivedByAdmin.supplierNotified, 'Le fournisseur ne doit pas être contacté directement par l’utilisateur.');
  assert(receivedByAdmin.recipient === 'Équipe TrustFund', 'Le destinataire utilisateur doit être TrustFund.');
  assert(receivedByAdmin.status === 'admin-review', 'La demande doit attendre la revue de l’administration.');

  await page.evaluate(() => {
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    enterApp('admin');
    showScreen('admin-support');
    document.getElementById('adminAskProvider').click();
  });
  assert(await page.$eval('#providerContactNotif', element => element.classList.contains('active')), 'L’administration ne transmet pas la vérification au fournisseur.');

  await page.evaluate(() => {
    enterApp('provider');
    showScreen('provider-notifications');
    document.getElementById('providerAvailabilityConfirm').click();
  });
  assert(await page.$eval('#adminReplyUserAvailability', element => !element.classList.contains('hidden')), 'La confirmation fournisseur ne revient pas à l’administration.');

  await page.evaluate(() => {
    enterApp('admin');
    showScreen('admin-support');
    document.getElementById('adminReplyUserAvailability').click();
    document.getElementById('availabilityReplyForm').requestSubmit();
  });
  const intermediaryResult = await page.evaluate(() => ({
    userNotified: !document.getElementById('userAvailabilityNotif').classList.contains('hidden'),
    finalStatus: state.availabilityRequest?.status,
    adminStatus: document.getElementById('availabilityAdminStatus').textContent.trim(),
  }));
  assert(intermediaryResult.userNotified, 'La réponse finale TrustFund n’arrive pas à l’utilisateur.');
  assert(intermediaryResult.finalStatus === 'user-informed', 'Le circuit de disponibilité n’est pas clôturé correctement.');

  console.log(JSON.stringify({ resetResult, receivedByAdmin, intermediaryResult }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
