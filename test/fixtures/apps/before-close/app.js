'use strict';

const sleep = require('mz-modules/sleep');

module.exports = app => {
  app.beforeClose(function* () {
    console.log('app closing');
    yield sleep(100);
    console.log(111);
    console.log('app closed');
  });
};
