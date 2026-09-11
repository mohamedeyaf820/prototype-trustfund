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
  await page.waitForFunction(() => typeof showAuth === 'function' && typeof setSignupStep === 'function');

  await page.evaluate(() => {
    showAuth('signup');
    setSignupRole('user');
    setSignupStep(2);
  });
  await page.type('#signupFirstName', 'Awa');
  await page.type('#signupLastName', 'Diop');
  await page.type('#signupPhone', '771234567');
  await page.type('#signupEmail', 'awa@example.sn');
  await page.evaluate(() => setSignupStep(3));
  await page.type('#signupPassword', 'TrustNouveau#26');
  await page.type('#signupPasswordConfirm', 'TrustNouveau#26');
  await page.click('#signupConsent');
  await page.evaluate(() => document.getElementById('signupForm').requestSubmit());

  const verifyVisible = await page.$eval('#auth-verify', (element) => element.classList.contains('active'));
  assert(verifyVisible, 'La vérification SMS ne s’affiche pas après la création du compte.');

  await page.evaluate(() => {
    document.querySelectorAll('.otp-fields input').forEach((input, index) => { input.value = String(index + 1); });
    document.getElementById('verifyForm').requestSubmit();
  });

  const postSignup = await page.evaluate(() => ({
    loginVisible: document.getElementById('auth-login').classList.contains('active'),
    appHidden: document.getElementById('appSession').classList.contains('hidden'),
    feedback: document.getElementById('loginFeedback').textContent.trim(),
    feedbackSuccess: document.getElementById('loginFeedback').classList.contains('success'),
    phone: document.getElementById('loginPhone').value,
    password: document.getElementById('loginPassword').value,
    forgotVisible: Boolean(document.querySelector('[data-open="passwordResetSheet"]')),
  }));
  assert(postSignup.loginVisible, 'La page de connexion ne s’affiche pas après le SMS.');
  assert(postSignup.appHidden, 'L’accueil est accessible avant la nouvelle connexion.');
  assert(postSignup.feedbackSuccess, 'Le message de compte créé n’est pas affiché.');
  assert(postSignup.phone === '77 123 45 67', 'Le téléphone créé n’est pas prérempli.');
  assert(postSignup.password === '', 'Le mot de passe ne doit pas être prérempli après l’inscription.');
  assert(postSignup.forgotVisible, 'L’option Mot de passe oublié est absente.');

  await page.type('#loginPassword', 'TrustNouveau#26');
  await page.evaluate(() => document.getElementById('loginForm').requestSubmit());
  const connected = await page.evaluate(() => ({
    appVisible: !document.getElementById('appSession').classList.contains('hidden'),
    homeVisible: document.getElementById('screen-home').classList.contains('active'),
    greeting: document.querySelector('.home-greeting h1')?.textContent.trim(),
  }));
  assert(connected.appVisible && connected.homeVisible, 'La connexion du nouveau compte n’ouvre pas l’accueil.');
  assert(connected.greeting === 'Awa', 'Le profil du nouveau compte n’est pas appliqué à l’accueil.');

  console.log(JSON.stringify({ postSignup, connected }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
