'use strict';

const { Config } = require('../config/config');

/**
 * Visually highlight an element with a yellow border and tinted background.
 * Makes test interactions clearly visible during video recording.
 *
 * @param {import('@playwright/test').Page}    page
 * @param {import('@playwright/test').Locator} locator
 */
async function highlight(page, locator) {
  try {
    const handle = await locator.elementHandle();
    if (handle) {
      await page.evaluate((el) => {
        el.style.outline         = '3px solid yellow';
        el.style.outlineOffset   = '2px';
        el.style.backgroundColor = 'rgba(255, 255, 0, 0.35)';
        el.style.transition      = 'all 0.15s ease';
      }, handle);
      await page.waitForTimeout(Config.timeouts.highlight);
    }
  } catch {
    // Highlighting is purely decorative; swallow all errors.
  }
}

module.exports = { highlight };
