'use strict';

const sleep = require('mz-modules/sleep');

module.exports = app => {
  const timeout = process.env.EGG_MASTER_CLOSE_TIMEOUT || 5000;

  app.beforeClose(function* () {
    app.logger.info('agent worker start close: ' + Date.now());
    yield sleep(timeout * 2);
    app.logger.info('agent worker: never called after timeout');
  });
};
