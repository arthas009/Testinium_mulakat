'use strict';

/**
 * CSS selector constants for the Grimelange product listing pages.
 */
const ProductListPageLocators = Object.freeze({
  PAGE_HEADING: 'h1, .category-title, .page-title',

  SORT_SELECT: '#filterOrderSelect',

  SORT_BUTTON: [
    '#filterOrderSelect',
    'button:has-text("Sıralama")',
    'a:has-text("Sıralama")',
    'span:has-text("Sıralama")',
    '.siralama-btn',
  ].join(', '),

  FILTER_BUTTON: [
    '.mobilFilterBtn',
    'a.mobilFilterBtn',
    '[class*="mobilFilterBtn"]',
  ].join(', '),

  FILTER_CLOSE: '.closeFilt',

  FILTER_PANEL: '.filterBlock, .Block_item.filterBlock, [class*="filtre"], [class*="filter-panel"], .filter-sidebar',

  APPLY_FILTER_BTN: [
    'button:has-text("SONUÇLARI GÖSTER")',
    'button:has-text("Uygula")',
    'a:has-text("SONUÇLARI GÖSTER")',
  ].join(', '),

  PRODUCT_CARDS: [
    '.productItem.eachNot',
    '.productItem:not(.productItemVariantDetail)',
    '.productItem',
    '.urun-listesi .urun',
    '.product-list .product-item',
    '[class*="urun-liste"] [class*="urun"]',
    '.listing-product',
  ].join(', '),

  PRODUCT_CARDS_WAIT: [
    '.productItem.eachNot',
    '.productItem:not(.productItemVariantDetail)',
    '.urun-listesi .urun',
    '.product-list .product-item',
    '[class*="urun-liste"] [class*="urun"]',
  ].join(', '),
});

module.exports = { ProductListPageLocators };
