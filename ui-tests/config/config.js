'use strict';

require('dotenv').config();

/**
 * UI project configuration.
 * All values are read from environment variables (see .env).
 */
const Config = Object.freeze({
  ui: Object.freeze({
    baseUrl: process.env.UI_BASE_URL,
  }),

  timeouts: Object.freeze({
    short:     Number(process.env.TIMEOUT_SHORT),
    medium:    Number(process.env.TIMEOUT_MEDIUM),
    long:      Number(process.env.TIMEOUT_LONG),
    highlight: Number(process.env.TIMEOUT_HIGHLIGHT),
  }),
});

module.exports = { Config };
