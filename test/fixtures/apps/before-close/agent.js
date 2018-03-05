'use strict';

const sleep = require('mz-modules/sleep');

module.exports = agent => {
  agent.beforeClose(function* () {
    console.log('agent closing');
    yield sleep(10);
    console.log('agent closed');
  });
};
