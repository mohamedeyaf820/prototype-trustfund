const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const ROOT = 'C:\\Users\\moham\\OneDrive\\Documents\\Trustfund';
const OUT_DIR = path.join(ROOT, 'tmp', 'pdfs', 'wireframe_extra_raw');
const CHROME = 'C:\\Users\\moham\\.cache\\puppeteer\\chrome\\win64-127.0.6533.88\\chrome-win64\\chrome.exe';

const scenarios = [
  { number: 46, mode: 'app', role: 'user', screen: 'home', dialog: 'kycSheet' },
  { number: 47, mode: 'app', role: 'user', screen: 'home', dialog: 'allocateSavingsSheet' },
  { number: 48, mode: 'app', role: 'user', screen: 'home', dialog: 'trustSheet' },
  { number: 49, mode: 'auth', auth: 'welcome', dialog: 'termsSheet' },
  { number: 50, mode: 'auth', auth: 'welcome', dialog: 'privacySheet' },
  { number: 51, mode: 'app', role: 'user', screen: 'support', dialog: 'ticketSheet' },
  { number: 52, mode: 'auth', auth: 'login', dialog: 'passwordResetSheet' },
  { number: 53, mode: 'app', role: 'user', screen: 'profile', dialog: 'profileEditSheet' },
  { number: 54, mode: 'app', role: 'user', screen: 'goal-detail', dialog: 'goalActionsSheet' },
  { number: 55, mode: 'app', role: 'provider', screen: 'provider-orders', dialog: 'orderDetailSheet' },
  { number: 56, mode: 'app', role: 'admin', screen: 'admin-support', dialog: 'adminReplySheet' },
  { number: 57, mode: 'app', role: 'admin', screen: 'admin', dialog: 'proofDecisionSheet' },
  { number: 58, mode: 'app', role: 'admin', screen: 'profile', dialog: 'adminProfileSheet' },
  { number: 59, mode: 'app', role: 'admin', screen: 'profile', dialog: 'adminAccessSheet' },
  { number: 60, mode: 'app', role: 'user', screen: 'finalization', dialog: 'receptionSheet' },
  { number: 61, mode: 'auth', auth: 'login', variant: 'accountCreated' },
  { number: 62, mode: 'auth', auth: 'login', variant: 'credentialsEntered' },
  { number: 63, mode: 'auth', auth: 'login', variant: 'resetChannel' },
  { number: 64, mode: 'auth', auth: 'login', variant: 'resetCode' },
  { number: 65, mode: 'auth', auth: 'login', variant: 'resetPassword' },
  { number: 66, mode: 'auth', auth: 'login', variant: 'resetComplete' },
  { number: 67, mode: 'app', role: 'user', screen: 'catalog', variant: 'contactTrustFund' },
  { number: 68, mode: 'app', role: 'admin', screen: 'admin-support', variant: 'adminAvailabilityRequest' },
  { number: 69, mode: 'app', role: 'provider', screen: 'notifications', variant: 'providerAvailabilityRequest' },
  { number: 70, mode: 'app', role: 'admin', screen: 'admin-support', variant: 'adminAvailabilityReply' },
  { number: 71, mode: 'app', role: 'user', screen: 'notifications', variant: 'userAvailabilityResult' },
];

async function prepareScenario(page, scenario) {
  await page.evaluate((item) => {
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
    if (item.mode === 'auth') {
      showAuth(item.auth);
    } else {
      enterApp(item.role);
      showScreen(item.screen);
    }
    if (item.dialog) {
      openSheet(item.dialog);
      const dialog = document.getElementById(item.dialog);
      if (dialog) dialog.scrollTop = 0;
    }
    if (item.variant === 'accountCreated' || item.variant === 'credentialsEntered') {
      document.querySelector('[data-phone-country="loginPhone"]').value = 'SN';
      document.getElementById('loginPhone').value = '771234567';
      validatePhoneInput(document.getElementById('loginPhone'));
      document.getElementById('loginPassword').value = item.variant === 'credentialsEntered' ? 'TrustNouveau#26' : '';
      setLoginFeedback(
        'Compte créé et téléphone confirmé. Connectez-vous maintenant avec votre numéro et votre mot de passe.',
        'success'
      );
      document.getElementById('demoToggle').setAttribute('aria-expanded', 'false');
      document.getElementById('demoAccounts').classList.remove('open');
    }
    if (item.variant?.startsWith('reset')) {
      if (item.variant !== 'resetComplete') {
        openPasswordResetFlow();
        document.querySelector('[data-phone-country="resetPhone"]').value = 'SN';
        document.getElementById('resetPhone').value = '77 000 00 01';
        validatePhoneInput(document.getElementById('resetPhone'), false);
      }
      if (item.variant === 'resetCode') {
        document.getElementById('resetDestination').textContent = '+221 77 ••• •• 01';
        setPasswordResetStep(2);
      }
      if (item.variant === 'resetPassword') {
        setPasswordResetStep(3);
      }
      if (item.variant === 'resetComplete') {
        document.querySelector('[data-phone-country="loginPhone"]').value = 'SN';
        document.getElementById('loginPhone').value = '77 000 00 01';
        validatePhoneInput(document.getElementById('loginPhone'), false);
        setLoginFeedback('Mot de passe modifié. Connectez-vous avec votre nouveau mot de passe.', 'success');
      }
    }
    if (item.variant === 'contactTrustFund') {
      document.getElementById('contactVendorAvatar').textContent = 'TF';
      document.getElementById('contactVendorName').textContent = 'Équipe TrustFund';
      document.getElementById('contactProductRef').value = 'Lenovo IdeaPad';
      document.getElementById('contactMessage').value = 'Je souhaite savoir si ce produit est toujours disponible. Merci de vérifier auprès du partenaire et de me répondre dans l’application.';
      openSheet('contactProviderSheet');
    }
    if (['adminAvailabilityRequest', 'providerAvailabilityRequest', 'adminAvailabilityReply', 'userAvailabilityResult'].includes(item.variant)) {
      state.availabilityRequest = {
        product: 'Lenovo IdeaPad',
        userName: 'Aïssatou Ndiaye',
        message: 'Je souhaite savoir si ce produit est disponible.',
        status: 'admin-review'
      };
      document.getElementById('availabilityAdminProduct').textContent = 'Lenovo IdeaPad';
      document.getElementById('availabilityAdminMessage').textContent = 'Aïssatou Ndiaye souhaite connaître la disponibilité de ce produit.';
      document.getElementById('availabilityAdminCard').classList.add('active');
    }
    if (item.variant === 'providerAvailabilityRequest') {
      state.availabilityRequest.status = 'supplier-review';
      document.getElementById('providerContactNotifText').textContent = 'TrustFund vous demande de confirmer la disponibilité de « Lenovo IdeaPad ».';
      document.getElementById('providerContactNotif').classList.add('active', 'unread');
    }
    if (item.variant === 'adminAvailabilityReply') {
      state.availabilityRequest.status = 'supplier-confirmed';
      document.getElementById('availabilityAdminStatus').textContent = 'Disponibilité confirmée · réponse utilisateur requise';
      document.getElementById('availabilityReplyMessage').value = 'Le produit « Lenovo IdeaPad » est disponible. Vous pouvez l’ajouter à votre objectif d’épargne.';
      openSheet('availabilityReplySheet');
    }
    if (item.variant === 'userAvailabilityResult') {
      state.availabilityRequest.status = 'user-informed';
      document.querySelector('#userAvailabilityNotif strong').textContent = 'Produit disponible';
      document.querySelector('#userAvailabilityNotif p').textContent = 'Le produit « Lenovo IdeaPad » est disponible. Vous pouvez l’ajouter à votre objectif d’épargne.';
      document.getElementById('userAvailabilityNotif').classList.remove('hidden');
    }
    const main = document.getElementById('appMain');
    if (main) main.scrollTop = 0;
  }, scenario);
  await new Promise((resolve) => setTimeout(resolve, 180));
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  const captureScale = Number(process.env.TRUST_CAPTURE_SCALE || 2);
  const firstScreen = Number(process.env.TRUST_CAPTURE_START || 46);
  const lastScreen = Number(process.env.TRUST_CAPTURE_END || 71);
  const captureWidth = Number(process.env.TRUST_CAPTURE_WIDTH || 1654);
  await page.setViewport({ width: captureWidth, height: 1170, deviceScaleFactor: captureScale });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => typeof openSheet === 'function' && typeof enterApp === 'function');
  await page.addStyleTag({ content: `
    *, *::before, *::after { animation: none !important; transition: none !important; }
    body { background: #f4f3ef !important; }
    .prototype-stage { min-height: 100vh !important; padding: 24px !important; }
    .phone-shell { width: 430px !important; height: 920px !important; box-shadow: 0 28px 74px rgba(0,0,0,.28) !important; }
    .phone-shell.role-admin { width: 1180px !important; border-radius: 22px !important; }
    dialog::backdrop { background: rgba(17, 19, 18, .46) !important; backdrop-filter: blur(2px); }
  ` });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 1900));

  for (const scenario of scenarios.filter(item => item.number >= firstScreen && item.number <= lastScreen)) {
    await prepareScenario(page, scenario);
    const filename = path.join(OUT_DIR, `screen-${String(scenario.number).padStart(2, '0')}.png`);
    await page.screenshot({ path: filename, type: 'png', captureBeyondViewport: false });
    console.log(filename);
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
