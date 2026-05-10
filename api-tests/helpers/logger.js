'use strict';

/**
 * Lightweight structured logger for test output.
 * Single Responsibility: formats and emits timestamped log messages.
 */
const Logger = Object.freeze({
  info(message, ...args) {
    console.log(`[INFO ] ${timestamp()} │ ${message}`, ...args);
  },
  warn(message, ...args) {
    console.warn(`[WARN ] ${timestamp()} │ ${message}`, ...args);
  },
  error(message, ...args) {
    console.error(`[ERROR] ${timestamp()} │ ${message}`, ...args);
  },
  step(step, description) {
    console.log(`\n[STEP ${step}] ─── ${description}`);
  },
});

/** @returns {string} Current time as "YYYY-MM-DD HH:MM:SS" */
function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

module.exports = { Logger };
