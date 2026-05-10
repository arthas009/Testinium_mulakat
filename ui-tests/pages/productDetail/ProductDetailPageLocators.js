'use strict';

/**
 * CSS selector constants for the Grimelange product detail page.
 */
const ProductDetailPageLocators = Object.freeze({
  PRODUCT_PRICE: [
    'span.discountPriceSpan',
    '.discountPriceSpan',
    '.discountPrice .discountPriceSpan',
  ].join(', '),

  PRICE_CONTAINER: '.PriceList, .productPrice, .discountPrice, [class*="fiyat"], [class*="price"]',

  COLOR_OPTIONS: [
    '[class*="renk"] a',
    '[class*="Renk"] a',
    '.renk-listesi a',
    '.renk-secimi a',
  ].join(', '),

  COLOR_WAIT: '[class*="renk"] a, [class*="Renk"] a, .renk-listesi a',

  SIZE_OPTIONS: [
    '.boxBedenler:not(.noStokUrunListe)',
    '.boxBedenler:not([class*="noStok"])',
  ].join(', '),

  SIZE_WAIT: '.boxBedenler, .boxBedenlerContainer',

  ADD_TO_CART_BTN: [
    'input.Addtobasket',
    'input.btnAddBasketOnDetail',
    'input[value="Sepete Ekle"]',
    '.basketBtn input[type="button"]',
    'button:has-text("Sepete Ekle")',
    'a:has-text("Sepete Ekle")',
  ].join(', '),

  CART_POPUP: [
    'a[onclick*="cart.remove"]',
    '.miniCartRigth.active',
    '.miniCartRigth',
    '#globalLiteCart',
    '.divSepetBlokContent',
  ].join(', '),

  CART_POPUP_PRICE: [
    '.divSepetBlokContent span.discountPriceSpan',
    '.divSepetBlokContent .discountPriceSpan',
    '.rightSideCartWrap .discountPriceSpan',
    '[class*="SepetBlok"] .discountPriceSpan',
    'span.discountPriceSpan',
  ].join(', '),

  CART_TOTAL_PRICE: '.miniCartTotalAmountTop .miniCartCol2, .totalAmount .miniCartCol2',

  QUANTITY_INCREASE: 'a.aMiniSepetArtir',

  QUANTITY_DISPLAY: 'input.txtMiniSepetAdet',

  REMOVE_PRODUCT: 'a[onclick*="cart.remove"]',

  EMPTY_CART: [
    '.miniCartRigth:not(:has(.miniCartItem))',
    '#globalLiteCart:not(:has(.miniCartItem))',
    '[class*="bos"]',
    '[class*="empty-cart"]',
  ].join(', '),
});

module.exports = { ProductDetailPageLocators };
