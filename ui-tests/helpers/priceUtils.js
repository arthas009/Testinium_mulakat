'use strict';

/**
 * Price parsing utilities for Turkish-formatted currency strings.
 * Turkish locale: thousands separator → ".", decimal separator → ","
 */

/**
 * Parse a Turkish-formatted price string into a JavaScript number.
 * @param {string} priceStr
 * @returns {number}
 */
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr
    .replaceAll(/[₺\s]/gu, '')
    .replaceAll('.', '')
    .replace(',', '.');
  return Number.parseFloat(cleaned) || 0;
}

/**
 * Returns true when two price values are within an acceptable tolerance.
 * @param {number} actual
 * @param {number} expected
 * @param {number} [tolerancePercent=1]
 * @returns {boolean}
 */
function pricesMatch(actual, expected, tolerancePercent = 1) {
  const tolerance = expected * (tolerancePercent / 100) + 1;
  return Math.abs(actual - expected) <= tolerance;
}

module.exports = { parsePrice, pricesMatch };
