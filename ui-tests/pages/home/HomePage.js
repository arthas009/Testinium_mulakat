'use strict';

const { BasePage }         = require('../base/BasePage');
const { HomePageLocators } = require('./HomePageLocators');
const { URLs }             = require('../../constants/urls');
const { Logger }           = require('../../helpers/logger');

/**
 * Page Object for the Grimelange homepage.
 * Responsibilities: cookie popup dismissal and top-nav menu navigation.
 */
class HomePage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    this.cookieRejectBtn = this.getLocator(HomePageLocators.COOKIE_REJECT_BTN);
    this.cookieAcceptBtn = this.getLocator(HomePageLocators.COOKIE_ACCEPT_BTN);
    this.erkekNavTrigger = this.getLocator(HomePageLocators.ERKEK_NAV_TRIGGER);
    this.pantolonSubLink = this.getLocator(HomePageLocators.PANTOLON_SUB_LINK);
  }

  async goto() {
    await super.goto(URLs.HOME);
  }

  async closePopup() {
    Logger.step(2, 'Closing cookie / popup dialog');
    await this.waitForNetworkIdle();

    try {
      const ccpDialog = this.page.locator('#ccp---nb');
      if (await ccpDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const ccpBtn = this.page
          .locator('[class*="ccp---nb-btn"], [class*="ccp---btn"], #ccp---nb button')
          .first();
        await ccpBtn.click({ force: true, timeout: 5000 });
        await ccpDialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        Logger.info('CCP cookie dialog dismissed.');
      }
    } catch { /* not present */ }

    try {
      const cerezClose = this.page.locator('#cerekKullanimUyari .closeBtn, .cerezPopupUyari .closeBtn');
      if (await cerezClose.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await this.highlightAndClick(cerezClose.first());
        await cerezClose.first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        Logger.info('Cerez popup dismissed.');
        return;
      }
    } catch { /* not present */ }

    if (await this.isVisible(this.cookieRejectBtn)) {
      await this.highlightAndClick(this.cookieRejectBtn);
      await this.cookieRejectBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      return;
    }
    if (await this.isVisible(this.cookieAcceptBtn)) {
      await this.highlightAndClick(this.cookieAcceptBtn);
      await this.cookieAcceptBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      return;
    }

    const closeBtn = this.getLocator(HomePageLocators.POPUP_CLOSE_BTN);
    if (await this.isVisible(closeBtn)) {
      await this.highlightAndClick(closeBtn);
      await closeBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  }

  async navigateToErkekPantolon() {
    Logger.step(3, 'Navigating to Erkek Pantolon (multi-strategy)');

    try {
      Logger.info('Strategy 1: click ERKEK nav → /erkek-giyim → click Pantolon');
      await this.highlightAndClick(
        this.page.locator('a[href="/erkek-giyim"]:not([class])').first()
      );
      await this.waitForDOMLoad();
      await this.waitForNetworkIdle();

      const pantolonLink = this.page
        .locator('a[href*="erkek-pantolon"], a:has-text("Pantolon")')
        .first();
      const found = await pantolonLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (found) {
        await this.highlightAndClick(pantolonLink);
        await this.waitForDOMLoad();
        if (this.page.url().includes('pantolon')) {
          Logger.info('Strategy 1 succeeded.');
          return;
        }
      }
      Logger.warn('Strategy 1: Pantolon link not found on erkek-giyim — falling back.');
    } catch (err) {
      Logger.warn(`Strategy 1 failed (${err.message}) — trying Strategy 2.`);
    }

    Logger.info('Strategy 2: navigating directly to erkek-pantolon URL');
    await super.goto(URLs.ERKEK_PANTOLON);
    await this.waitForDOMLoad();
    Logger.info('Strategy 2 succeeded.');
  }
}

module.exports = { HomePage };
