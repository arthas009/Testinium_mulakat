'use strict';

/**
 * CSS selector constants for the Grimelange homepage.
 * Covers: cookie/popup dialogs and the top-nav ERKEK → Pantolon flow.
 */
const HomePageLocators = Object.freeze({
  COOKIE_REJECT_BTN: [
    '#cerekKullanimUyari .closeBtn',
    '.cerezPopupUyari .closeBtn',
    'button:has-text("Tümünü Reddet")',
    'button:has-text("Reddet")',
  ].join(', '),

  COOKIE_ACCEPT_BTN: [
    'button:has-text("Tümünü Kabul Et")',
    'a:has-text("Tümünü Kabul Et")',
  ].join(', '),

  POPUP_CLOSE_BTN: [
    '#cerekKullanimUyari .closeBtn',
    '.cerezPopupUyari .closeBtn',
    '[class*="ccp---nb"] [class*="accept"]',
    '[id^="ccp"] button',
    '.modal .close',
    '.popup .close',
    'button[aria-label="Kapat"]',
    'button[aria-label="Close"]',
    '.close-btn',
    '.btn-close',
  ].join(', '),

  ERKEK_NAV_TRIGGER: [
    'a[href="/erkek-giyim"]:not([class])',
    'nav a:has-text("ERKEK")',
    'li:has-text("ERKEK") > a',
    '.main-menu a:has-text("ERKEK")',
  ].join(', '),

  PANTOLON_SUB_LINK: [
    'a[href*="erkek-pantolon"]',
    '.sub-menu a:has-text("Pantolon")',
    '.dropdown-menu a:has-text("Pantolon")',
    '[class*="submenu"] a:has-text("Pantolon")',
    '[class*="mega-menu"] a:has-text("Pantolon")',
    'a:has-text("Pantolon")',
  ].join(', '),

  PANTOLON_CATEGORY_LINK: [
    'a[href*="erkek-pantolon"]',
    '.category-list a:has-text("Pantolon")',
    '.alt-kategori a:has-text("Pantolon")',
    'a:has-text("Pantolon")',
  ].join(', '),

  PANTOLON_WAIT: [
    'a[href*="erkek-pantolon"]',
    '.sub-menu a:has-text("Pantolon")',
    '[class*="submenu"] a:has-text("Pantolon")',
  ].join(', '),
});

module.exports = { HomePageLocators };
