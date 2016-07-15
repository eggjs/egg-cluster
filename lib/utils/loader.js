'use strict';

const BaseLoader = require('egg-loader');

/**
 * master loader, won't load plugins
 * @see https://github.com/eggjs/egg-loader
 */
class MasterLoader extends BaseLoader {

  /**
   * override `BaseLoader.loadConfig`
   * @return {Object} config object
   */
  loadConfig() {
    super.loadConfig();
    return this.config;
  }
}

module.exports = MasterLoader;
