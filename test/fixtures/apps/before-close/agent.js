'use strict';

const sleep = require('mz-modules/sleep');

module.exports = agent => {
  agent.beforeClose(function* () {
    console.log('agent closing');
    yield sleep(100);
    console.log('agent closed');
  });
};
