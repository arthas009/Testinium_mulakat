'use strict';

const { highlight } = require('../../helpers/highlight');
const { Logger }    = require('../../helpers/logger');
const { Config }    = require('../../config/config');

/**
 * Abstract base page providing shared Playwright utilities.
 */
class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page    = page;
    this.timeout = Config.timeouts;
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async goto(url) {
    Logger.info(`Navigating → ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  // ── Wait utilities ─────────────────────────────────────────────────────────

  async waitForDOMLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('load').catch(() => {});
  }

  async waitForVisible(selector, timeout = this.timeout.medium) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  async pause(ms) {
    await this.page.waitForTimeout(ms);
  }

  // ── Locator factory ────────────────────────────────────────────────────────

  getLocator(selector) {
    return this.page.locator(selector).first();
  }

  getLocatorAll(selector) {
    return this.page.locator(selector);
  }

  // ── Interaction helpers ────────────────────────────────────────────────────

  async highlightAndClick(locator) {
    await highlight(this.page, locator);
    await locator.click();
  }

  async highlightAndHover(locator) {
    await highlight(this.page, locator);
    await locator.hover();
  }

  async scrollIntoView(locator) {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
  }

  async isVisible(locator) {
    return locator.isVisible().catch(() => false);
  }
}

module.exports = { BasePage };
