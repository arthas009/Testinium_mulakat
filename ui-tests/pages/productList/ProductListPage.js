'use strict';

const { BasePage }                = require('../base/BasePage');
const { ProductListPageLocators } = require('./ProductListPageLocators');
const { Logger }                  = require('../../helpers/logger');

/**
 * Page Object for the Grimelange product listing pages (category/filtered views).
 * Responsibilities: sort selection, filter application, random product navigation.
 */
class ProductListPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.pageHeading  = this.getLocator(ProductListPageLocators.PAGE_HEADING);
    this.sortButton   = this.getLocator(ProductListPageLocators.SORT_BUTTON);
    this.filterButton = this.getLocator(ProductListPageLocators.FILTER_BUTTON);
    this.productCards = this.getLocatorAll(ProductListPageLocators.PRODUCT_CARDS);
  }

  async isOnPage(keyword) {
    await this.waitForDOMLoad();
    const url     = this.page.url().toLowerCase();
    const heading = (await this.pageHeading.textContent().catch(() => '')).toUpperCase();
    return url.includes(keyword.toLowerCase()) || heading.includes(keyword.toUpperCase());
  }

  async selectSort(optionText) {
    Logger.step(5, `Selecting sort option: "${optionText}"`);
    const select = this.page.locator(ProductListPageLocators.SORT_SELECT);
    await select.waitFor({ state: 'visible', timeout: this.timeout.medium });

    const norm = s => s.toLowerCase().replace(/[\s()]/g, '');
    const allOpts = await select.locator('option').allTextContents();
    const match = allOpts.find(t => norm(t) === norm(optionText))
               || allOpts.find(t => norm(t).includes(norm(optionText)))
               || allOpts.find(t => norm(optionText).includes(norm(t).substring(0, 6))
                               && norm(t) !== 'siralamaseciniz');

    if (match) {
      await select.selectOption({ label: match });
      Logger.info(`Sort applied: "${match}"`);
    } else {
      Logger.warn(`Sort option "${optionText}" not found. Available: ${allOpts.join(', ')}`);
    }
    await this.waitForNetworkIdle();
  }

  async getCurrentSortLabel() {
    try {
      const select = this.page.locator(ProductListPageLocators.SORT_SELECT);
      const value = await select.inputValue();
      const text  = await select.locator(`option[value="${value}"]`).textContent();
      return text?.trim() ?? '';
    } catch {
      return '';
    }
  }

  async applyFilter(filterText) {
    Logger.step(7, `Applying filter: "${filterText}"`);

    await this.page.evaluate(() => {
      document.querySelectorAll('[id^="ccp---"]').forEach(el => el.remove());
    }).catch(() => {});

    await this.highlightAndClick(this.filterButton);
    await this.waitForVisible(ProductListPageLocators.FILTER_PANEL).catch(() => {});

    const optSel = [
      `label:has-text("${filterText}")`,
      `a:has-text("${filterText}")`,
      `span:has-text("${filterText}")`,
      `li:has-text("${filterText}")`,
    ].join(', ');
    const optLocator = this.page.locator(optSel).first();
    const found = await optLocator.isVisible({ timeout: 5000 }).catch(() => false);

    if (!found) {
      Logger.warn(`Filter option "${filterText}" not found in panel — closing panel and continuing.`);
      await this.page.keyboard.press('Escape').catch(() => {});
      const closeBtn = this.getLocator(ProductListPageLocators.FILTER_CLOSE);
      if (await this.isVisible(closeBtn)) {
        await closeBtn.click({ force: true }).catch(() => {});
      }
      await this.page.evaluate(() => {
        document.querySelectorAll('.Block_item.filterBlock.active, .filterBlock.active').forEach(el => el.classList.remove('active'));
      }).catch(() => {});
      await this.page.waitForSelector('.Block_item.filterBlock.active, .filterBlock.active', { state: 'hidden', timeout: 5000 }).catch(() => {});
      return;
    }

    await this.highlightAndClick(optLocator);

    const applyBtn = this.getLocator(ProductListPageLocators.APPLY_FILTER_BTN);
    if (await this.isVisible(applyBtn)) {
      await this.highlightAndClick(applyBtn);
    }
    await this.waitForNetworkIdle();
  }

  async clickRandomProduct() {
    Logger.step(7, 'Selecting a random product from the listing');
    await this.waitForVisible(ProductListPageLocators.PRODUCT_CARDS_WAIT, this.timeout.long);

    const count = await this.productCards.count();
    if (count === 0) throw new Error('No products found on the listing page');

    const index   = Math.floor(Math.random() * Math.min(count, 8));
    const product = this.productCards.nth(index);
    const detailLink = product.locator('.detailLink, .detailUrl, a.detailLink, a').first();
    const name = (await detailLink.getAttribute('title').catch(() => null))
              || (await detailLink.textContent().catch(() => 'Unknown product')).trim();

    Logger.info(`Selected product [${index}]: ${name}`);
    await this.scrollIntoView(product);
    await this.page.evaluate(() => {
      document.querySelectorAll('.Block_item.filterBlock.active, .filterBlock.active')
        .forEach(el => el.classList.remove('active'));
    }).catch(() => {});
    await this.highlightAndClick(detailLink);
    await this.waitForDOMLoad();

    return name;
  }
}

module.exports = { ProductListPage };
