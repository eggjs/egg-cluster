'use strict';

module.exports = function(app) {
  app.messenger.on('egg-ready', () => console.log('app receive egg-ready'));
};
