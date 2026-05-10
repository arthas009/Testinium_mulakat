'use strict';

const { BasePage }                  = require('../base/BasePage');
const { ProductDetailPageLocators } = require('./ProductDetailPageLocators');
const { Logger }                    = require('../../helpers/logger');

/**
 * Page Object for the Grimelange product detail page.
 * Responsibilities: color/size selection, add-to-cart, cart popup interactions.
 */
class ProductDetailPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    this.productPrice     = this.getLocator(ProductDetailPageLocators.PRODUCT_PRICE);
    this.colorOptions     = this.getLocatorAll(ProductDetailPageLocators.COLOR_OPTIONS);
    this.sizeOptions      = this.getLocatorAll(ProductDetailPageLocators.SIZE_OPTIONS);
    this.addToCartBtn     = this.getLocator(ProductDetailPageLocators.ADD_TO_CART_BTN);
    this.cartPopup        = this.getLocator(ProductDetailPageLocators.CART_POPUP);
    this.cartPopupPrice   = this.getLocator(ProductDetailPageLocators.CART_POPUP_PRICE);
    this.cartTotalPrice   = this.getLocator(ProductDetailPageLocators.CART_TOTAL_PRICE);
    this.quantityIncBtn   = this.getLocator(ProductDetailPageLocators.QUANTITY_INCREASE);
    this.quantityDisplay  = this.getLocator(ProductDetailPageLocators.QUANTITY_DISPLAY);
    this.removeProductBtn = this.getLocator(ProductDetailPageLocators.REMOVE_PRODUCT);
    this.emptyCartMsg     = this.getLocator(ProductDetailPageLocators.EMPTY_CART);
  }

  async getProductPrice() {
    await this.waitForVisible(ProductDetailPageLocators.PRICE_CONTAINER);
    return (await this.productPrice.textContent())?.trim() ?? '';
  }

  async selectRandomColor() {
    Logger.step(8, 'Selecting a random color');
    await this.waitForVisible(ProductDetailPageLocators.COLOR_WAIT, this.timeout.short).catch(() => {});

    const visibleColors = this.colorOptions.filter({ visible: true });
    const count = await visibleColors.count();
    if (count === 0) { Logger.warn('No visible color options — skipping color step'); return; }

    const color = visibleColors.nth(Math.floor(Math.random() * count));
    await this.scrollIntoView(color);
    await this.highlightAndClick(color);
    await this.waitForNetworkIdle();
  }

  async selectRandomSize() {
    Logger.step(9, 'Selecting a random size');
    await this.waitForVisible(ProductDetailPageLocators.SIZE_WAIT, this.timeout.short).catch(() => {});

    const visibleSizes = this.sizeOptions.filter({ visible: true });
    const count = await visibleSizes.count();
    if (count === 0) { Logger.warn('No visible size options — skipping size step'); return; }

    const size = visibleSizes.nth(Math.floor(Math.random() * count));
    await this.scrollIntoView(size);
    await size.click({ force: true });
    await this.waitForNetworkIdle();
  }

  async clickAddToCart() {
    Logger.step(10, 'Adding product to cart');
    await this.highlightAndClick(this.addToCartBtn);
    await this.waitForVisible(ProductDetailPageLocators.CART_POPUP, this.timeout.long);
    await this.waitForVisible(ProductDetailPageLocators.CART_POPUP_PRICE, this.timeout.medium).catch(() => {});
  }

  async getCartPopupPrice() {
    return (await this.cartPopupPrice.textContent())?.trim() ?? '';
  }

  async getCartTotalPrice() {
    return (await this.cartTotalPrice.textContent())?.trim() ?? '';
  }

  async increaseQuantityByOne() {
    Logger.step(12, 'Increasing product quantity by 1');
    const before = await this.quantityDisplay.inputValue().catch(() => '1');
    await this.highlightAndClick(this.quantityIncBtn);
    await this.page.waitForFunction(
      ({ sel, prev }) => { const el = document.querySelector(sel); return el && el.value !== prev; },
      { sel: 'input.txtMiniSepetAdet', prev: before },
      { timeout: 10000 }
    ).catch(() => {});
    await this.waitForNetworkIdle();
  }

  async getCartPopupQuantity() {
    const tag = await this.quantityDisplay.evaluate((el) => el.tagName).catch(() => 'SPAN');
    if (tag === 'INPUT') return this.quantityDisplay.inputValue();
    return (await this.quantityDisplay.textContent())?.trim() ?? '0';
  }

  async removeProductFromCart() {
    Logger.step(14, 'Removing product from cart');
    await this.highlightAndClick(this.removeProductBtn);
    await this.page.waitForSelector('.miniCartItem', { state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async isCartEmpty() {
    await this.page.waitForSelector('.miniCartItem', { state: 'hidden', timeout: 10000 }).catch(() => {});
    if (await this.isVisible(this.emptyCartMsg)) return true;
    const text = (await this.cartPopup.textContent().catch(() => '')).toLowerCase();
    return text.includes('boş') || text.includes('empty') || text.includes('0 ürün');
  }
}

module.exports = { ProductDetailPage };
