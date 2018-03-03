'use strict';

const sleep = require('mz-modules/sleep');

module.exports = app => {
  app.beforeClose(function* () {
    console.log('app closing');
    yield sleep(10);
    console.log('app closed');
  });
};
