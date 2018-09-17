'use strict';

const sleep = require('mz-modules/sleep');

module.exports = app => {
  const timeout = process.env.EGG_MASTER_CLOSE_TIMEOUT || 5000;

  app.beforeClose(function* () {
    app.logger.info('app worker start close', Date.now(), timeout);
    yield sleep(timeout * 2);
    app.logger.info('app worker never called after timeout');
  });
};
