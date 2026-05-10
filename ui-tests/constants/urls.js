'use strict';

const { Config } = require('../config/config');

/**
 * Application URL constants derived from the base URL in Config.
 */
const URLs = Object.freeze({
  HOME:           Config.ui.baseUrl,
  ERKEK_GIYIM:   `${Config.ui.baseUrl}/erkek-giyim`,
  ERKEK_PANTOLON:`${Config.ui.baseUrl}/erkek-pantolon`,
});

module.exports = { URLs };
