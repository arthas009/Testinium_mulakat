'use strict';

const { test, expect }              = require('@playwright/test');
const { HomePage }                  = require('../pages/home/HomePage');
const { ProductListPage }           = require('../pages/productList/ProductListPage');
const { ProductDetailPage }         = require('../pages/productDetail/ProductDetailPage');
const { parsePrice, pricesMatch }   = require('../helpers/priceUtils');
const { Logger }                    = require('../helpers/logger');

test.describe('Grimelange UI Senaryosu', () => {
  /** @type {HomePage} */         let home;
  /** @type {ProductListPage} */  let listing;
  /** @type {ProductDetailPage} */let detail;

  test.beforeEach(async ({ page }) => {
    home    = new HomePage(page);
    listing = new ProductListPage(page);
    detail  = new ProductDetailPage(page);
  });

  test('Erkek Pantolon → Ürün Seç → Sepete Ekle → Doğrulama', async ({ page }) => {

    // ── Step 1 ────────────────────────────────────────────────────────────────
    await test.step('1 - Ana sayfaya git', async () => {
      Logger.step(1, 'Navigating to grimelange.com.tr');
      await home.goto();
    });

    // ── Step 2 ────────────────────────────────────────────────────────────────
    await test.step('2 - Popup kapat', async () => {
      await home.closePopup();
    });

    // ── Step 3 ────────────────────────────────────────────────────────────────
    await test.step('3 - ERKEK menüsü → Pantolon', async () => {
      await home.navigateToErkekPantolon();
    });

    // ── Step 4 — soft: URL check is informational; execution continues ─────────
    await test.step('4 - Erkek Pantolon sayfası doğrula', async () => {
      Logger.step(4, 'Verifying Erkek Pantolon page');
      expect.soft(
        page.url().toLowerCase(),
        'URL "pantolon" içermeli'
      ).toContain('pantolon');
      expect.soft(
        await listing.isOnPage('PANTOLON'),
        'Sayfa başlığı PANTOLON içermeli'
      ).toBeTruthy();
    });

    // ── Step 5 ────────────────────────────────────────────────────────────────
    await test.step('5 - Fiyata göre(artan) sırala', async () => {
      await listing.selectSort('Fiyata göre(artan)');
    });

    // ── Step 6 — soft: sort label mismatch should not stop the run ────────────
    await test.step('6 - Sıralama değişti mi doğrula', async () => {
      Logger.step(6, 'Verifying sort label changed');
      const sortLabel = await listing.getCurrentSortLabel();
      expect.soft(sortLabel.toLowerCase(), 'Sıralama etiketi "artan" içermeli').toContain('artan');
    });

    // ── Step 7 ────────────────────────────────────────────────────────────────
    await test.step('7 - Rastgele ürün seç', async () => {
      await listing.clickRandomProduct();
    });

    // ── Steps 8–9 ─────────────────────────────────────────────────────────────
    await test.step('8 - Renk seç', async () => {
      await detail.selectRandomColor();
    });

    await test.step('9 - Beden seç', async () => {
      await detail.selectRandomSize();
    });

    // Read product price before adding to cart
    let productPriceNum = 0;
    let rawProductPrice = '';
    await test.step('Ürün fiyatını oku', async () => {
      rawProductPrice = await detail.getProductPrice();
      productPriceNum = parsePrice(rawProductPrice);
      Logger.info(`Product price: ${rawProductPrice} → ${productPriceNum}`);
    });

    // ── Step 10 ───────────────────────────────────────────────────────────────
    await test.step('10 - Sepete ekle', async () => {
      await detail.clickAddToCart();
    });

    // ── Step 11 — soft: price comparison allows ±1% tolerance ────────────────
    let popupPriceNum = 0;
    await test.step('11 - Popup fiyatı ile ürün fiyatını karşılaştır', async () => {
      Logger.step(11, 'Comparing cart popup price with product page price');
      const rawPopupPrice = await detail.getCartPopupPrice();
      popupPriceNum = parsePrice(rawPopupPrice);
      Logger.info(`Cart popup price: ${rawPopupPrice} → ${popupPriceNum}`);
      expect.soft(
        pricesMatch(popupPriceNum, productPriceNum),
        `Popup fiyatı (${rawPopupPrice}) ürün fiyatı (${rawProductPrice}) ile eşleşmeli`
      ).toBeTruthy();
    });

    // ── Step 12 ───────────────────────────────────────────────────────────────
    let quantityBefore = '1';
    let cartTotalBefore = 0;
    await test.step('12 - Ürün adedini 1 artır ve doğrula', async () => {
      quantityBefore = await detail.getCartPopupQuantity();
      cartTotalBefore = parsePrice(await detail.getCartTotalPrice());
      await detail.increaseQuantityByOne();
      const quantityAfter = await detail.getCartPopupQuantity();
      expect(
        Number.parseInt(quantityAfter, 10),
        'Ürün adedi 1 artmalı'
      ).toBeGreaterThan(Number.parseInt(quantityBefore, 10));
    });

    // ── Step 13 — soft: compare cart grand total before vs after qty increase ──
    await test.step('13 - Fiyatın arttığını doğrula', async () => {
      Logger.step(13, 'Verifying grand total increased after quantity change');
      await page.waitForFunction(
        ({ sel, prev }) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          const txt = (el.textContent || '').trim().replace(/[^\d,]/g, '').replace(',', '.');
          return parseFloat(txt) > 0 && parseFloat(txt) !== prev;
        },
        { sel: '.miniCartTotalAmountTop .miniCartCol2, .totalAmount .miniCartCol2', prev: cartTotalBefore },
        { timeout: 8000 }
      ).catch(() => {});
      const cartTotalAfterNum = parsePrice(await detail.getCartTotalPrice());
      Logger.info(`Cart total before: ${cartTotalBefore} → after: ${cartTotalAfterNum}`);
      expect.soft(
        cartTotalAfterNum,
        'Adet artınca sepet toplam fiyatı artmalı'
      ).toBeGreaterThan(cartTotalBefore);
    });

    // ── Step 14 ───────────────────────────────────────────────────────────────
    await test.step('14 - Ürünü sil ve sepet boş olduğunu doğrula', async () => {
      await detail.removeProductFromCart();
      expect(await detail.isCartEmpty(), 'Sepet boş olmalı').toBeTruthy();
    });
  });
});
