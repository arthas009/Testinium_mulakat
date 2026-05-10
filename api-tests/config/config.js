'use strict';

require('dotenv').config();

/**
 * API project configuration.
 * All values are read from environment variables (see .env).
 */
const Config = Object.freeze({
  api: Object.freeze({
    baseUrl: process.env.API_BASE_URL,
    token:   process.env.GOREST_TOKEN,
  }),
});

module.exports = { Config };
