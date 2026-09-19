const path = require('path');
const { test, expect } = require('@playwright/test');
const { login, completeKYC } = require('./helpers/auth');

const asset = name => path.join(__dirname, '..', 'assets', name);
const PHOTOS = ['product-laptop.webp', 'product-sewing-machine.webp', 'product-solar-kit.webp', 'product-design-course.webp'];

test.describe('Publication d\'offre Fournisseur', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page, 'provider');
  });

  test('ajout progressif de 4 photos une par une', async ({ page }) => {
    await page.locator('[data-open="offerSheet"]').first().click();
    await completeKYC(page);
    await expect(page.locator('#offerSheet')).toBeVisible();

    for (const photo of PHOTOS) {
      await page.setInputFiles('#offerImage', asset(photo));
      await expect(page.locator('#offerImageGallery [data-photo-slot].filled')).toHaveCount(
        PHOTOS.indexOf(photo) + 1
      );
    }

    await expect(page.locator('#offerPhotoHelp')).toContainText('4 photos');
    await expect(page.locator('#offerPhotoHelp')).toContainText('maximum atteint');
  });

  test('clic sur un slot remplace sa photo sans en perdre une', async ({ page }) => {
    await page.locator('[data-open="offerSheet"]').first().click();
    await completeKYC(page);

    for (const photo of PHOTOS) {
      await page.setInputFiles('#offerImage', asset(photo));
    }
    const before = await page.evaluate(() => state.offerImages[2].slice(0, 60));

    await page.click('[data-photo-slot="2"]');
    await page.setInputFiles('#offerImage', asset('product-laptop.webp'));
    await expect(page.locator('#offerImageGallery [data-photo-slot].filled')).toHaveCount(4);

    const after = await page.evaluate(() => state.offerImages[2].slice(0, 60));
    expect(after).not.toBe(before);
  });

  test('Suivant refuse moins de 2 photos puis passe a l\'etape 2', async ({ page }) => {
    await page.locator('[data-open="offerSheet"]').first().click();
    await completeKYC(page);

    await page.fill('#offerName', 'Réfrigérateur solaire');
    await page.setInputFiles('#offerImage', asset(PHOTOS[0]));
    await page.click('#offerNext');
    await expect(page.locator('#toastZone .toast').filter({ hasText: 'Ajoutez deux photos' })).toBeVisible();

    await page.setInputFiles('#offerImage', asset(PHOTOS[1]));
    await page.click('#offerNext');
    await expect(page.locator('.offer-step[data-offer-step="2"]')).toBeVisible();
  });
});
