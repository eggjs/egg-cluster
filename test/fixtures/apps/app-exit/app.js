'use strict';

const sleep = require('mz-modules/sleep');

module.exports = app => {
  app.beforeClose(function* () {
    app.logger.info('close start');
    console.log(123);
    yield sleep(1000);
    console.log(321);
    app.logger.info('close end');
  });
};
